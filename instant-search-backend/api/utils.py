"""
Utility functions for API endpoints.

This module provides common utility functions to reduce code duplication
across API endpoints, particularly for model conversions.
"""

from typing import List

from domain.models import StudyBook
from domain.dtos import StudyBookResponse


def to_study_book_response(study_book: StudyBook) -> StudyBookResponse:
    """Convert StudyBook domain model to response DTO."""
    return StudyBookResponse(
        id=study_book.id,
        user_id=study_book.user_id,
        title=study_book.title,
        description=study_book.description,
        created_at=study_book.created_at,
        updated_at=study_book.updated_at
    )


def to_study_book_responses(study_books: List[StudyBook]) -> List[StudyBookResponse]:
    """Convert list of StudyBook domain models to response DTOs."""
    return [to_study_book_response(sb) for sb in study_books]