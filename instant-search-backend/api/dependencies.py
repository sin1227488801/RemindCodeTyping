"""
Shared dependencies for API endpoints.

This module provides common dependency functions used across multiple API routers
to eliminate code duplication and ensure consistency.
"""

from uuid import UUID

from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.auth import MockAuthenticationService
from domain.exceptions import UnauthorizedAccessError
from infra.database import get_db_session
from infra.repositories import (
    SQLAlchemyUserRepository, SQLAlchemyStudyBookRepository, SQLAlchemyQuestionRepository,
    SQLAlchemyTypingLogRepository, SQLAlchemyLearningEventRepository
)
from infra.sqlite_search import SQLiteFtsStrategy
from app.config import settings


# Authentication dependencies
def get_auth_service(session: Session = Depends(get_db_session)) -> MockAuthenticationService:
    """Dependency to get authentication service."""
    user_repo = SQLAlchemyUserRepository(session)
    return MockAuthenticationService(user_repo)


def get_current_user_id(
    request: Request,
    auth_service: MockAuthenticationService = Depends(get_auth_service)
) -> UUID:
    """Dependency to get current authenticated user ID."""
    try:
        return auth_service.get_current_user_id(request)
    except UnauthorizedAccessError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


# Repository dependencies
def get_user_repository(session: Session = Depends(get_db_session)) -> SQLAlchemyUserRepository:
    """Dependency to get user repository."""
    return SQLAlchemyUserRepository(session)


def get_study_book_repository(session: Session = Depends(get_db_session)) -> SQLAlchemyStudyBookRepository:
    """Dependency to get study book repository."""
    return SQLAlchemyStudyBookRepository(session)


def get_question_repository(session: Session = Depends(get_db_session)) -> SQLAlchemyQuestionRepository:
    """Dependency to get question repository."""
    return SQLAlchemyQuestionRepository(session)


def get_typing_log_repository(session: Session = Depends(get_db_session)) -> SQLAlchemyTypingLogRepository:
    """Dependency to get typing log repository."""
    return SQLAlchemyTypingLogRepository(session)


def get_learning_event_repository(session: Session = Depends(get_db_session)) -> SQLAlchemyLearningEventRepository:
    """Dependency to get learning event repository."""
    return SQLAlchemyLearningEventRepository(session)


# Search dependencies
def get_search_strategy() -> SQLiteFtsStrategy:
    """Dependency to get search strategy."""
    return SQLiteFtsStrategy(settings.database_url)


# System Problems Service dependencies
def get_system_problems_service():
    """Dependency to get system problems service instance."""
    from app.cached_service import CachedSystemProblemsService
    return CachedSystemProblemsService(cache_size=settings.system_problems_cache_size)