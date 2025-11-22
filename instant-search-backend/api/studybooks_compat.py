"""
StudyBooks compatibility API endpoints.

This module provides compatibility endpoints for frontend applications that expect
specific API structures for language lists and system problems.
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from api.dependencies import get_current_user_id, get_system_problems_service
from app.system_problems_service import SystemProblemsService
from domain.system_problems import SystemProblemResponse
from app.compatibility_errors import CompatibilityErrorHandler, CompatibilityLogger


router = APIRouter(prefix="/studybooks", tags=["studybooks-compatibility"])


@router.get("/languages", response_model=List[str])
async def get_languages_compat(
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
    service: SystemProblemsService = Depends(get_system_problems_service)
):
    """Frontend compatibility endpoint for available languages."""
    try:
        # Log endpoint access
        CompatibilityLogger.log_endpoint_access("languages", user_id, request.state.trace_id, request)
        
        # Get available languages from service
        languages = await service.get_available_languages()
        
        # Convert to title case for frontend compatibility
        formatted_languages = [lang.title() for lang in languages]
        
        # Log successful operation
        CompatibilityLogger.log_operation_success(
            "get_languages", user_id, request.state.trace_id, languages_count=len(formatted_languages)
        )
        
        return formatted_languages
        
    except Exception as e:
        # Handle service error
        return CompatibilityErrorHandler.handle_service_error(
            request, e, "SystemProblemsService", "retrieve available languages"
        )


@router.get("/system-problems/{language}", response_model=List[SystemProblemResponse])
async def get_system_problems(
    language: str,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
    service: SystemProblemsService = Depends(get_system_problems_service)
):
    """Get system problems for specified language. Case-insensitive language matching."""
    try:
        # Log endpoint access
        CompatibilityLogger.log_endpoint_access(
            "system-problems", user_id, request.state.trace_id, request, language=language
        )
        
        # Get problems from service (service handles case normalization)
        problems = await service.get_problems_by_language(language)
        
        # Handle case where language is not found (return empty list as per requirements)
        if not problems:
            CompatibilityLogger.log_language_request(
                language, user_id, request.state.trace_id, found=False, problems_count=0
            )
            return CompatibilityErrorHandler.handle_language_not_found(language)
        
        # Convert to response format
        response_problems = [
            SystemProblemResponse.from_domain(problem, language)
            for problem in problems
        ]
        
        # Log language request details
        CompatibilityLogger.log_language_request(
            language, user_id, request.state.trace_id, found=True, problems_count=len(response_problems)
        )
        
        return response_problems
        
    except Exception as e:
        # Handle service error
        return CompatibilityErrorHandler.handle_service_error(
            request, e, "SystemProblemsService", "retrieve system problems"
        )