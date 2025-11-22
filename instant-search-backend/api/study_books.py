"""
StudyBook management API endpoints.

This module provides CRUD operations for study books with proper user scoping,
request/response validation using Pydantic models, and appropriate HTTP status codes.
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from api.dependencies import get_current_user_id, get_study_book_repository
from api.utils import to_study_book_response, to_study_book_responses
from domain.dtos import (
    StudyBookCreateRequest, StudyBookUpdateRequest, StudyBookResponse
)
from domain.models import StudyBook
from domain.exceptions import StudyBookNotFoundError, ValidationError
from infra.repositories import SQLAlchemyStudyBookRepository


router = APIRouter(prefix="/study-books", tags=["study-books"])


@router.get("/languages", response_model=List[str])
async def get_languages(
    user_id: UUID = Depends(get_current_user_id),
    study_book_repo: SQLAlchemyStudyBookRepository = Depends(get_study_book_repository)
):
    """
    Get all unique languages from user's study books.
    
    Args:
        user_id: Current authenticated user ID
        study_book_repo: StudyBook repository
        
    Returns:
        List of unique languages
    """
    # Get all study books for user
    study_books = await study_book_repo.get_by_user_id(user_id)
    
    # Extract unique languages (assuming we add language field to StudyBook)
    # For now, return default languages
    default_languages = ["Python", "JavaScript", "Java", "SQL", "HTML", "CSS", "TypeScript", "Go", "Rust", "C++"]
    return default_languages


@router.post("/", response_model=StudyBookResponse, status_code=status.HTTP_201_CREATED)
async def create_study_book(
    request: StudyBookCreateRequest,
    user_id: UUID = Depends(get_current_user_id),
    study_book_repo: SQLAlchemyStudyBookRepository = Depends(get_study_book_repository)
):
    """
    Create a new study book for the authenticated user.
    
    Args:
        request: StudyBook creation data
        user_id: Current authenticated user ID
        study_book_repo: StudyBook repository
        
    Returns:
        Created StudyBook data
        
    Raises:
        HTTPException: 400 for validation errors, 401 for authentication errors
    """
    try:
        # Create domain model
        study_book = StudyBook(
            user_id=user_id,
            title=request.title,
            description=request.description
        )
        
        # Save to repository
        created_study_book = await study_book_repo.create(study_book)
        
        # Convert to response model
        return to_study_book_response(created_study_book)
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[StudyBookResponse])
async def get_study_books(
    user_id: UUID = Depends(get_current_user_id),
    study_book_repo: SQLAlchemyStudyBookRepository = Depends(get_study_book_repository)
):
    """
    Get all study books for the authenticated user.
    
    Args:
        user_id: Current authenticated user ID
        study_book_repo: StudyBook repository
        
    Returns:
        List of user's study books
    """
    # Get study books from repository
    study_books = await study_book_repo.get_by_user_id(user_id)
    
    # Convert to response models
    return to_study_book_responses(study_books)


@router.get("/{study_book_id}", response_model=StudyBookResponse)
async def get_study_book(
    study_book_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    study_book_repo: SQLAlchemyStudyBookRepository = Depends(get_study_book_repository)
):
    """
    Get a specific study book by ID for the authenticated user.
    
    Args:
        study_book_id: UUID of the study book to retrieve
        user_id: Current authenticated user ID
        study_book_repo: StudyBook repository
        
    Returns:
        StudyBook data
        
    Raises:
        HTTPException: 404 if not found
    """
    # Get study book from repository
    study_book = await study_book_repo.get_by_id(study_book_id, user_id)
    
    if not study_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study book with ID {study_book_id} not found"
        )
    
    # Convert to response model
    return to_study_book_response(study_book)


@router.put("/{study_book_id}", response_model=StudyBookResponse)
async def update_study_book(
    study_book_id: UUID,
    request: StudyBookUpdateRequest,
    user_id: UUID = Depends(get_current_user_id),
    study_book_repo: SQLAlchemyStudyBookRepository = Depends(get_study_book_repository)
):
    """
    Update a study book for the authenticated user.
    
    Args:
        study_book_id: UUID of the study book to update
        request: StudyBook update data
        user_id: Current authenticated user ID
        study_book_repo: StudyBook repository
        
    Returns:
        Updated StudyBook data
        
    Raises:
        HTTPException: 400 for validation errors, 404 if not found
    """
    try:
        # Get existing study book
        existing_study_book = await study_book_repo.get_by_id(study_book_id, user_id)
        
        if not existing_study_book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Study book with ID {study_book_id} not found"
            )
        
        # Update fields if provided
        if request.title is not None:
            existing_study_book.title = request.title
        if request.description is not None:
            existing_study_book.description = request.description
        
        # Save updated study book
        updated_study_book = await study_book_repo.update(existing_study_book)
        
        # Convert to response model
        return to_study_book_response(updated_study_book)
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except StudyBookNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{study_book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_study_book(
    study_book_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    study_book_repo: SQLAlchemyStudyBookRepository = Depends(get_study_book_repository)
):
    """
    Delete a study book for the authenticated user.
    
    Args:
        study_book_id: UUID of the study book to delete
        user_id: Current authenticated user ID
        study_book_repo: StudyBook repository
        
    Raises:
        HTTPException: 404 if not found
    """
    # Delete study book
    deleted = await study_book_repo.delete(study_book_id, user_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study book with ID {study_book_id} not found"
        )