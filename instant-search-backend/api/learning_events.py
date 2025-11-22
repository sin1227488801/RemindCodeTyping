"""
Learning analytics API endpoints.

This module provides endpoints for recording and retrieving learning events
with time-series ordering, pagination, and proper user scoping for analytics.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query

from api.dependencies import get_current_user_id, get_learning_event_repository
from domain.dtos import (
    LearningEventCreateRequest, LearningEventResponse, PaginatedLearningEventsResponse
)
from domain.models import LearningEvent
from domain.exceptions import ValidationError
from infra.repositories import SQLAlchemyLearningEventRepository


router = APIRouter(prefix="/learning-events", tags=["learning-events"])


@router.post("/", response_model=LearningEventResponse, status_code=status.HTTP_201_CREATED)
async def create_learning_event(
    request: LearningEventCreateRequest,
    user_id: UUID = Depends(get_current_user_id),
    learning_event_repo: SQLAlchemyLearningEventRepository = Depends(get_learning_event_repository)
):
    """
    Record a new learning event for the authenticated user.
    
    Args:
        request: Learning event creation data
        user_id: Current authenticated user ID
        learning_event_repo: Learning event repository
        
    Returns:
        Created LearningEvent data
        
    Raises:
        HTTPException: 400 for validation errors
    """
    try:
        # Create domain model (user_id is string in LearningEvent)
        learning_event = LearningEvent(
            user_id=str(user_id),
            app_id=request.app_id,
            action=request.action,
            object_id=request.object_id,
            score=request.score,
            duration_ms=request.duration_ms
        )
        
        # Save to repository
        created_event = await learning_event_repo.create(learning_event)
        
        # Convert to response model
        return LearningEventResponse(
            id=created_event.id,
            user_id=created_event.user_id,
            app_id=created_event.app_id,
            action=created_event.action,
            object_id=created_event.object_id,
            score=created_event.score,
            duration_ms=created_event.duration_ms,
            occurred_at=created_event.occurred_at
        )
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=PaginatedLearningEventsResponse)
async def get_learning_events(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(50, ge=1, le=100, description="Number of items per page"),
    action: Optional[str] = Query(None, description="Filter by specific action type"),
    user_id: UUID = Depends(get_current_user_id),
    learning_event_repo: SQLAlchemyLearningEventRepository = Depends(get_learning_event_repository)
):
    """
    Get learning events for the authenticated user with pagination and filtering.
    
    Results are ordered by occurrence time (newest first) for time-series analysis.
    
    Args:
        page: Page number (1-based)
        limit: Number of items per page (1-100)
        action: Optional filter by specific action type
        user_id: Current authenticated user ID
        learning_event_repo: Learning event repository
        
    Returns:
        Paginated list of learning events ordered by occurrence time (newest first)
    """
    # Calculate offset
    offset = (page - 1) * limit
    
    # Convert UUID to string for learning events
    user_id_str = str(user_id)
    
    # Get learning events from repository
    if action:
        learning_events = await learning_event_repo.get_by_action(user_id_str, action, limit, offset)
    else:
        learning_events = await learning_event_repo.get_by_user_id(user_id_str, limit, offset)
    
    # Get total count for pagination
    total_count = await learning_event_repo.count_by_user_id(user_id_str)
    
    # Convert to response models
    items = [
        LearningEventResponse(
            id=le.id,
            user_id=le.user_id,
            app_id=le.app_id,
            action=le.action,
            object_id=le.object_id,
            score=le.score,
            duration_ms=le.duration_ms,
            occurred_at=le.occurred_at
        )
        for le in learning_events
    ]
    
    # Calculate pagination info
    has_next = (offset + len(items)) < total_count
    has_previous = page > 1
    
    return PaginatedLearningEventsResponse(
        items=items,
        page=page,
        limit=limit,
        total_count=total_count,
        has_next=has_next,
        has_previous=has_previous
    )


@router.get("/{event_id}", response_model=LearningEventResponse)
async def get_learning_event(
    event_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    learning_event_repo: SQLAlchemyLearningEventRepository = Depends(get_learning_event_repository)
):
    """
    Get a specific learning event by ID for the authenticated user.
    
    Args:
        event_id: UUID of the learning event to retrieve
        user_id: Current authenticated user ID
        learning_event_repo: Learning event repository
        
    Returns:
        LearningEvent data
        
    Raises:
        HTTPException: 404 if not found
    """
    # Convert UUID to string for learning events
    user_id_str = str(user_id)
    
    # Get learning event from repository
    learning_event = await learning_event_repo.get_by_id(event_id, user_id_str)
    
    if not learning_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning event with ID {event_id} not found"
        )
    
    # Convert to response model
    return LearningEventResponse(
        id=learning_event.id,
        user_id=learning_event.user_id,
        app_id=learning_event.app_id,
        action=learning_event.action,
        object_id=learning_event.object_id,
        score=learning_event.score,
        duration_ms=learning_event.duration_ms,
        occurred_at=learning_event.occurred_at
    )


@router.get("/analytics/summary")
async def get_learning_analytics_summary(
    user_id: UUID = Depends(get_current_user_id),
    learning_event_repo: SQLAlchemyLearningEventRepository = Depends(get_learning_event_repository)
):
    """
    Get learning analytics summary for the authenticated user.
    
    Args:
        user_id: Current authenticated user ID
        learning_event_repo: Learning event repository
        
    Returns:
        Summary analytics including total events, action breakdown, and performance metrics
    """
    # Convert UUID to string for learning events
    user_id_str = str(user_id)
    
    # Get recent learning events for analytics
    recent_events = await learning_event_repo.get_by_user_id(user_id_str, limit=1000)
    
    if not recent_events:
        return {
            "total_events": 0,
            "action_breakdown": {},
            "average_score": 0.0,
            "total_duration_ms": 0,
            "unique_objects": 0
        }
    
    # Calculate analytics
    total_events = len(recent_events)
    
    # Action breakdown
    action_counts = {}
    for event in recent_events:
        action_counts[event.action] = action_counts.get(event.action, 0) + 1
    
    # Performance metrics
    scored_events = [e for e in recent_events if e.score is not None]
    average_score = sum(e.score for e in scored_events) / len(scored_events) if scored_events else 0.0
    
    timed_events = [e for e in recent_events if e.duration_ms is not None]
    total_duration_ms = sum(e.duration_ms for e in timed_events)
    
    # Unique objects interacted with
    unique_objects = len(set(e.object_id for e in recent_events if e.object_id is not None))
    
    return {
        "total_events": total_events,
        "action_breakdown": action_counts,
        "average_score": round(average_score, 4) if average_score else 0.0,
        "total_duration_ms": total_duration_ms,
        "unique_objects": unique_objects
    }


@router.get("/analytics/actions")
async def get_action_types(
    user_id: UUID = Depends(get_current_user_id),
    learning_event_repo: SQLAlchemyLearningEventRepository = Depends(get_learning_event_repository)
):
    """
    Get list of unique action types for the authenticated user.
    
    This endpoint helps frontends provide filtering options based on
    the actual actions recorded for the user.
    
    Args:
        user_id: Current authenticated user ID
        learning_event_repo: Learning event repository
        
    Returns:
        List of unique action types used by the user
    """
    # Convert UUID to string for learning events
    user_id_str = str(user_id)
    
    # Get recent learning events to extract action types
    recent_events = await learning_event_repo.get_by_user_id(user_id_str, limit=1000)
    
    # Extract unique action types
    action_types = list(set(event.action for event in recent_events))
    action_types.sort()  # Sort alphabetically for consistent ordering
    
    return {
        "action_types": action_types,
        "total_unique_actions": len(action_types)
    }