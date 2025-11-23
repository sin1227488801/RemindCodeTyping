"""
Data Transfer Objects (DTOs) for API requests and responses.

This module contains Pydantic models used for API serialization,
separate from domain models to maintain clean boundaries.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# User DTOs
class UserCreateRequest(BaseModel):
    """Request model for creating a new user."""
    
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


class UserResponse(BaseModel):
    """Response model for user data."""
    
    id: UUID
    name: str
    email: str
    created_at: datetime
    updated_at: datetime


# StudyBook DTOs
class StudyBookCreateRequest(BaseModel):
    """Request model for creating a new study book."""
    
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)


class StudyBookUpdateRequest(BaseModel):
    """Request model for updating a study book."""
    
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)


class StudyBookResponse(BaseModel):
    """Response model for study book data."""
    
    id: UUID
    user_id: UUID
    title: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime


# Question DTOs
class QuestionCreateRequest(BaseModel):
    """Request model for creating a new question."""
    
    language: str = Field(..., min_length=1, max_length=50)
    category: str = Field(..., min_length=1, max_length=100)
    difficulty: str = Field(..., pattern=r'^(easy|medium|hard)$')
    question: str = Field(..., min_length=1, max_length=2000)
    answer: str = Field(default="", max_length=2000)  # Allow empty answer/explanation


class QuestionUpdateRequest(BaseModel):
    """Request model for updating a question."""
    
    language: Optional[str] = Field(None, min_length=1, max_length=50)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    difficulty: Optional[str] = Field(None, pattern=r'^(easy|medium|hard)$')
    question: Optional[str] = Field(None, min_length=1, max_length=2000)
    answer: Optional[str] = Field(None, min_length=1, max_length=2000)


class QuestionResponse(BaseModel):
    """Response model for question data."""
    
    id: UUID
    study_book_id: UUID
    language: str
    category: str
    difficulty: str
    question: str
    answer: str
    created_at: datetime
    updated_at: datetime


class RandomQuestionResponse(BaseModel):
    """Response model for random question (optionally without answer)."""
    
    id: UUID
    study_book_id: UUID
    language: str
    category: str
    difficulty: str
    question: str
    answer: Optional[str] = None  # Can be hidden based on request parameter
    created_at: datetime
    updated_at: datetime


# TypingLog DTOs
class TypingLogCreateRequest(BaseModel):
    """Request model for creating a typing log entry."""
    
    question_id: Optional[UUID] = None
    wpm: int = Field(..., ge=0, le=1000)
    accuracy: float = Field(..., ge=0.0, le=1.0)
    took_ms: int = Field(..., ge=0)


class TypingLogResponse(BaseModel):
    """Response model for typing log data."""
    
    id: UUID
    user_id: UUID
    question_id: Optional[UUID]
    wpm: int
    accuracy: float
    took_ms: int
    created_at: datetime


# LearningEvent DTOs
class LearningEventCreateRequest(BaseModel):
    """Request model for creating a learning event."""
    
    app_id: str = Field(..., min_length=1)
    action: str = Field(..., min_length=1, max_length=100)
    object_id: Optional[str] = Field(None, max_length=100)
    score: Optional[float] = Field(None, ge=0.0, le=1.0)
    duration_ms: Optional[int] = Field(None, ge=0)


class LearningEventResponse(BaseModel):
    """Response model for learning event data."""
    
    id: UUID
    user_id: str
    app_id: str
    action: str
    object_id: Optional[str]
    score: Optional[float]
    duration_ms: Optional[int]
    occurred_at: datetime


# Search DTOs
class SearchResult(BaseModel):
    """Response model for search results."""
    
    question_id: UUID
    question: str
    answer: str
    highlight: str
    score: float


class SearchResponse(BaseModel):
    """Response model for search API."""
    
    query: str
    results: List[SearchResult]
    total_count: int


# Pagination DTOs
class PaginationParams(BaseModel):
    """Request model for pagination parameters."""
    
    page: int = Field(1, ge=1)
    limit: int = Field(50, ge=1, le=100)


class PaginatedResponse(BaseModel):
    """Base response model for paginated results."""
    
    page: int
    limit: int
    total_count: int
    has_next: bool
    has_previous: bool


class PaginatedLearningEventsResponse(PaginatedResponse):
    """Paginated response for learning events."""
    
    items: List[LearningEventResponse]


class PaginatedTypingLogsResponse(PaginatedResponse):
    """Paginated response for typing logs."""
    
    items: List[TypingLogResponse]


# Health Check DTOs
class HealthCheckComponent(BaseModel):
    """Health check component status."""
    
    status: str
    message: Optional[str] = None


class HealthCheckResponse(BaseModel):
    """Health check response model."""
    
    status: str  # healthy, degraded, unhealthy
    version: str
    timestamp: datetime
    checks: dict[str, HealthCheckComponent]