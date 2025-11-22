"""
Question management API endpoints.

This module provides CRUD operations for questions with study book association,
random question selection, and proper user scoping through study book ownership.
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query

from api.dependencies import get_current_user_id, get_question_repository, get_study_book_repository
from domain.dtos import (
    QuestionCreateRequest, QuestionUpdateRequest, QuestionResponse, RandomQuestionResponse
)
from domain.models import Question
from domain.exceptions import QuestionNotFoundError, ValidationError
from infra.repositories import SQLAlchemyQuestionRepository, SQLAlchemyStudyBookRepository


router = APIRouter(prefix="/questions", tags=["questions"])


@router.post("/", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    request: QuestionCreateRequest,
    study_book_id: UUID = Query(..., description="ID of the study book to add the question to"),
    user_id: UUID = Depends(get_current_user_id),
    question_repo: SQLAlchemyQuestionRepository = Depends(get_question_repository),
    study_book_repo: SQLAlchemyStudyBookRepository = Depends(get_study_book_repository)
):
    """
    Create a new question in a study book for the authenticated user.
    
    Args:
        request: Question creation data
        study_book_id: UUID of the study book to add the question to
        user_id: Current authenticated user ID
        question_repo: Question repository
        study_book_repo: StudyBook repository for ownership verification
        
    Returns:
        Created Question data
        
    Raises:
        HTTPException: 400 for validation errors, 404 if study book not found
    """
    try:
        # Verify study book exists and user owns it
        study_book = await study_book_repo.get_by_id(study_book_id, user_id)
        if not study_book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Study book with ID {study_book_id} not found"
            )
        
        # Create domain model
        question = Question(
            study_book_id=study_book_id,
            language=request.language,
            category=request.category,
            difficulty=request.difficulty,
            question=request.question,
            answer=request.answer
        )
        
        # Save to repository
        created_question = await question_repo.create(question)
        
        # Convert to response model
        return QuestionResponse(
            id=created_question.id,
            study_book_id=created_question.study_book_id,
            language=created_question.language,
            category=created_question.category,
            difficulty=created_question.difficulty,
            question=created_question.question,
            answer=created_question.answer,
            created_at=created_question.created_at,
            updated_at=created_question.updated_at
        )
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[QuestionResponse])
async def get_questions_by_study_book(
    study_book_id: UUID = Query(..., description="ID of the study book to get questions from"),
    user_id: UUID = Depends(get_current_user_id),
    question_repo: SQLAlchemyQuestionRepository = Depends(get_question_repository),
    study_book_repo: SQLAlchemyStudyBookRepository = Depends(get_study_book_repository)
):
    """
    Get all questions for a study book owned by the authenticated user.
    
    Args:
        study_book_id: UUID of the study book
        user_id: Current authenticated user ID
        question_repo: Question repository
        study_book_repo: StudyBook repository for ownership verification
        
    Returns:
        List of questions in the study book
        
    Raises:
        HTTPException: 404 if study book not found
    """
    # Verify study book exists and user owns it
    study_book = await study_book_repo.get_by_id(study_book_id, user_id)
    if not study_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study book with ID {study_book_id} not found"
        )
    
    # Get questions from repository
    questions = await question_repo.get_by_study_book_id(study_book_id, user_id)
    
    # Convert to response models
    return [
        QuestionResponse(
            id=q.id,
            study_book_id=q.study_book_id,
            language=q.language,
            category=q.category,
            difficulty=q.difficulty,
            question=q.question,
            answer=q.answer,
            created_at=q.created_at,
            updated_at=q.updated_at
        )
        for q in questions
    ]


@router.get("/random", response_model=RandomQuestionResponse)
async def get_random_question(
    study_book_id: UUID = Query(..., description="ID of the study book to get random question from"),
    hide_answer: bool = Query(False, description="Whether to hide the answer in the response"),
    user_id: UUID = Depends(get_current_user_id),
    question_repo: SQLAlchemyQuestionRepository = Depends(get_question_repository),
    study_book_repo: SQLAlchemyStudyBookRepository = Depends(get_study_book_repository)
):
    """
    Get a random question from a study book owned by the authenticated user.
    
    Args:
        study_book_id: UUID of the study book
        hide_answer: Whether to hide the answer in the response
        user_id: Current authenticated user ID
        question_repo: Question repository
        study_book_repo: StudyBook repository for ownership verification
        
    Returns:
        Random question from the study book (optionally without answer)
        
    Raises:
        HTTPException: 404 if study book not found or no questions available
    """
    # Verify study book exists and user owns it
    study_book = await study_book_repo.get_by_id(study_book_id, user_id)
    if not study_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study book with ID {study_book_id} not found"
        )
    
    # Get random question from repository
    question = await question_repo.get_random_by_study_book_id(study_book_id, user_id)
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No questions found in study book {study_book_id}"
        )
    
    # Convert to response model (optionally hiding answer)
    return RandomQuestionResponse(
        id=question.id,
        study_book_id=question.study_book_id,
        language=question.language,
        category=question.category,
        difficulty=question.difficulty,
        question=question.question,
        answer=None if hide_answer else question.answer,
        created_at=question.created_at,
        updated_at=question.updated_at
    )


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    question_repo: SQLAlchemyQuestionRepository = Depends(get_question_repository)
):
    """
    Get a specific question by ID for the authenticated user.
    
    Args:
        question_id: UUID of the question to retrieve
        user_id: Current authenticated user ID
        question_repo: Question repository
        
    Returns:
        Question data
        
    Raises:
        HTTPException: 404 if not found
    """
    # Get question from repository (scoped to user through study book ownership)
    question = await question_repo.get_by_id(question_id, user_id)
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question with ID {question_id} not found"
        )
    
    # Convert to response model
    return QuestionResponse(
        id=question.id,
        study_book_id=question.study_book_id,
        language=question.language,
        category=question.category,
        difficulty=question.difficulty,
        question=question.question,
        answer=question.answer,
        created_at=question.created_at,
        updated_at=question.updated_at
    )


@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: UUID,
    request: QuestionUpdateRequest,
    user_id: UUID = Depends(get_current_user_id),
    question_repo: SQLAlchemyQuestionRepository = Depends(get_question_repository)
):
    """
    Update a question for the authenticated user.
    
    Args:
        question_id: UUID of the question to update
        request: Question update data
        user_id: Current authenticated user ID
        question_repo: Question repository
        
    Returns:
        Updated Question data
        
    Raises:
        HTTPException: 400 for validation errors, 404 if not found
    """
    try:
        # Get existing question (scoped to user through study book ownership)
        existing_question = await question_repo.get_by_id(question_id, user_id)
        
        if not existing_question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question with ID {question_id} not found"
            )
        
        # Update fields if provided
        if request.language is not None:
            existing_question.language = request.language
        if request.category is not None:
            existing_question.category = request.category
        if request.difficulty is not None:
            existing_question.difficulty = request.difficulty
        if request.question is not None:
            existing_question.question = request.question
        if request.answer is not None:
            existing_question.answer = request.answer
        
        # Save updated question
        updated_question = await question_repo.update(existing_question, user_id)
        
        # Convert to response model
        return QuestionResponse(
            id=updated_question.id,
            study_book_id=updated_question.study_book_id,
            language=updated_question.language,
            category=updated_question.category,
            difficulty=updated_question.difficulty,
            question=updated_question.question,
            answer=updated_question.answer,
            created_at=updated_question.created_at,
            updated_at=updated_question.updated_at
        )
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except QuestionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    question_repo: SQLAlchemyQuestionRepository = Depends(get_question_repository)
):
    """
    Delete a question for the authenticated user.
    
    Args:
        question_id: UUID of the question to delete
        user_id: Current authenticated user ID
        question_repo: Question repository
        
    Raises:
        HTTPException: 404 if not found
    """
    # Delete question (scoped to user through study book ownership)
    deleted = await question_repo.delete(question_id, user_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question with ID {question_id} not found"
        )