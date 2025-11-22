"""
Typing performance tracking API endpoints.

This module provides endpoints for creating and retrieving typing logs
with validation, user scoping, and performance metrics storage.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query

from api.dependencies import get_current_user_id, get_typing_log_repository, get_question_repository
from domain.dtos import (
    TypingLogCreateRequest, TypingLogResponse, PaginatedTypingLogsResponse
)
from domain.models import TypingLog
from domain.exceptions import ValidationError
from infra.repositories import SQLAlchemyTypingLogRepository, SQLAlchemyQuestionRepository


router = APIRouter(prefix="/typing-logs", tags=["typing-logs"])


@router.post("/", response_model=TypingLogResponse, status_code=status.HTTP_201_CREATED)
async def create_typing_log(
    request: TypingLogCreateRequest,
    user_id: UUID = Depends(get_current_user_id),
    typing_log_repo: SQLAlchemyTypingLogRepository = Depends(get_typing_log_repository),
    question_repo: SQLAlchemyQuestionRepository = Depends(get_question_repository)
):
    """
    Create a new typing log entry for the authenticated user.
    
    Args:
        request: Typing log creation data
        user_id: Current authenticated user ID
        typing_log_repo: Typing log repository
        question_repo: Question repository for validation
        
    Returns:
        Created TypingLog data
        
    Raises:
        HTTPException: 400 for validation errors, 404 if question not found
    """
    try:
        # Validate question exists and user has access (if question_id provided)
        if request.question_id:
            question = await question_repo.get_by_id(request.question_id, user_id)
            if not question:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Question with ID {request.question_id} not found"
                )
        
        # Create domain model
        typing_log = TypingLog(
            user_id=user_id,
            question_id=request.question_id,
            wpm=request.wpm,
            accuracy=request.accuracy,
            took_ms=request.took_ms
        )
        
        # Save to repository
        created_typing_log = await typing_log_repo.create(typing_log)
        
        # Convert to response model
        return TypingLogResponse(
            id=created_typing_log.id,
            user_id=created_typing_log.user_id,
            question_id=created_typing_log.question_id,
            wpm=created_typing_log.wpm,
            accuracy=created_typing_log.accuracy,
            took_ms=created_typing_log.took_ms,
            created_at=created_typing_log.created_at
        )
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=PaginatedTypingLogsResponse)
async def get_typing_logs(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(50, ge=1, le=100, description="Number of items per page"),
    question_id: Optional[UUID] = Query(None, description="Filter by specific question ID"),
    user_id: UUID = Depends(get_current_user_id),
    typing_log_repo: SQLAlchemyTypingLogRepository = Depends(get_typing_log_repository)
):
    """
    Get typing logs for the authenticated user with pagination.
    
    Args:
        page: Page number (1-based)
        limit: Number of items per page (1-100)
        question_id: Optional filter by specific question ID
        user_id: Current authenticated user ID
        typing_log_repo: Typing log repository
        
    Returns:
        Paginated list of typing logs ordered by creation time (newest first)
    """
    # Calculate offset
    offset = (page - 1) * limit
    
    # Get typing logs from repository
    if question_id:
        typing_logs = await typing_log_repo.get_by_question_id(question_id, user_id, limit, offset)
        total_count = await typing_log_repo.count_by_user_id(user_id)  # Note: This is approximate for question filtering
    else:
        typing_logs = await typing_log_repo.get_by_user_id(user_id, limit, offset)
        total_count = await typing_log_repo.count_by_user_id(user_id)
    
    # Convert to response models
    items = [
        TypingLogResponse(
            id=tl.id,
            user_id=tl.user_id,
            question_id=tl.question_id,
            wpm=tl.wpm,
            accuracy=tl.accuracy,
            took_ms=tl.took_ms,
            created_at=tl.created_at
        )
        for tl in typing_logs
    ]
    
    # Calculate pagination info
    has_next = (offset + len(items)) < total_count
    has_previous = page > 1
    
    return PaginatedTypingLogsResponse(
        items=items,
        page=page,
        limit=limit,
        total_count=total_count,
        has_next=has_next,
        has_previous=has_previous
    )


@router.get("/{typing_log_id}", response_model=TypingLogResponse)
async def get_typing_log(
    typing_log_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    typing_log_repo: SQLAlchemyTypingLogRepository = Depends(get_typing_log_repository)
):
    """
    Get a specific typing log by ID for the authenticated user.
    
    Args:
        typing_log_id: UUID of the typing log to retrieve
        user_id: Current authenticated user ID
        typing_log_repo: Typing log repository
        
    Returns:
        TypingLog data
        
    Raises:
        HTTPException: 404 if not found
    """
    # Get typing log from repository
    typing_log = await typing_log_repo.get_by_id(typing_log_id, user_id)
    
    if not typing_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Typing log with ID {typing_log_id} not found"
        )
    
    # Convert to response model
    return TypingLogResponse(
        id=typing_log.id,
        user_id=typing_log.user_id,
        question_id=typing_log.question_id,
        wpm=typing_log.wpm,
        accuracy=typing_log.accuracy,
        took_ms=typing_log.took_ms,
        created_at=typing_log.created_at
    )


@router.get("/stats/summary")
async def get_typing_stats_summary(
    user_id: UUID = Depends(get_current_user_id),
    typing_log_repo: SQLAlchemyTypingLogRepository = Depends(get_typing_log_repository)
):
    """
    Get typing performance statistics summary for the authenticated user.
    
    Args:
        user_id: Current authenticated user ID
        typing_log_repo: Typing log repository
        
    Returns:
        Summary statistics including average WPM, accuracy, and total sessions
    """
    # Get recent typing logs for statistics
    recent_logs = await typing_log_repo.get_by_user_id(user_id, limit=100)
    
    if not recent_logs:
        return {
            "total_sessions": 0,
            "average_wpm": 0.0,
            "average_accuracy": 0.0,
            "best_wpm": 0,
            "best_accuracy": 0.0,
            "total_time_ms": 0
        }
    
    # Calculate statistics
    total_sessions = len(recent_logs)
    average_wpm = sum(log.wpm for log in recent_logs) / total_sessions
    average_accuracy = sum(log.accuracy for log in recent_logs) / total_sessions
    best_wpm = max(log.wpm for log in recent_logs)
    best_accuracy = max(log.accuracy for log in recent_logs)
    total_time_ms = sum(log.took_ms for log in recent_logs)
    
    return {
        "total_sessions": total_sessions,
        "average_wpm": round(average_wpm, 2),
        "average_accuracy": round(average_accuracy, 4),
        "best_wpm": best_wpm,
        "best_accuracy": round(best_accuracy, 4),
        "total_time_ms": total_time_ms
    }


# Add compatibility endpoint for frontend
@router.get("/stats")
async def get_typing_stats(
    user_id: UUID = Depends(get_current_user_id),
    typing_log_repo: SQLAlchemyTypingLogRepository = Depends(get_typing_log_repository)
):
    """
    Get typing performance statistics for the authenticated user.
    Compatibility endpoint for frontend.
    """
    # Get recent typing logs for statistics
    recent_logs = await typing_log_repo.get_by_user_id(user_id, limit=50)
    
    if not recent_logs:
        return {
            "totalAttempts": 0,
            "averageAccuracy": 0.0,
            "bestAccuracy": 0.0,
            "averageWpm": 0.0,
            "bestWpm": 0
        }
    
    # Calculate statistics
    total_attempts = len(recent_logs)
    average_accuracy = sum(log.accuracy for log in recent_logs) / total_attempts
    best_accuracy = max(log.accuracy for log in recent_logs)
    average_wpm = sum(log.wpm for log in recent_logs) / total_attempts
    best_wpm = max(log.wpm for log in recent_logs)
    
    return {
        "totalAttempts": total_attempts,
        "averageAccuracy": round(average_accuracy, 1),
        "bestAccuracy": round(best_accuracy, 1),
        "averageWpm": round(average_wpm, 1),
        "bestWpm": best_wpm
    }