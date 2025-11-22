"""
Domain models for the instant search backend.

This module contains the core domain entities as Pydantic models,
following the design specifications for data validation and serialization.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, validator


class User(BaseModel):
    """User domain model representing a system user."""
    
    id: UUID = Field(default_factory=uuid4)
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('email')
    def validate_email_lowercase(cls, v):
        """Ensure email is stored in lowercase for consistency."""
        return v.lower()
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat() + 'Z',
            UUID: str
        }


class StudyBook(BaseModel):
    """StudyBook domain model representing a collection of questions."""
    
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat() + 'Z',
            UUID: str
        }


class Question(BaseModel):
    """Question domain model representing a single question in a study book."""
    
    id: UUID = Field(default_factory=uuid4)
    study_book_id: UUID
    language: str = Field(..., min_length=1, max_length=50)
    category: str = Field(..., min_length=1, max_length=100)
    difficulty: str = Field(..., pattern=r'^(easy|medium|hard)$')
    question: str = Field(..., min_length=1, max_length=2000)
    answer: str = Field(..., min_length=1, max_length=2000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('difficulty')
    def validate_difficulty(cls, v):
        """Ensure difficulty is one of the allowed values."""
        allowed = {'easy', 'medium', 'hard'}
        if v not in allowed:
            raise ValueError(f'Difficulty must be one of: {", ".join(allowed)}')
        return v
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat() + 'Z',
            UUID: str
        }


class TypingLog(BaseModel):
    """TypingLog domain model for tracking typing performance."""
    
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    question_id: Optional[UUID] = None
    wpm: int = Field(..., ge=0, le=1000)
    accuracy: float = Field(..., ge=0.0, le=1.0)
    took_ms: int = Field(..., ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('wpm')
    def validate_wpm(cls, v):
        """Validate words per minute is reasonable."""
        if v < 0 or v > 1000:
            raise ValueError('WPM must be between 0 and 1000')
        return v
    
    @validator('accuracy')
    def validate_accuracy(cls, v):
        """Validate accuracy is a percentage between 0 and 1."""
        if v < 0.0 or v > 1.0:
            raise ValueError('Accuracy must be between 0.0 and 1.0')
        return v
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat() + 'Z',
            UUID: str
        }


class LearningEvent(BaseModel):
    """LearningEvent domain model for tracking learning activities."""
    
    id: UUID = Field(default_factory=uuid4)
    user_id: str = Field(..., min_length=1)
    app_id: str = Field(..., min_length=1)
    action: str = Field(..., min_length=1, max_length=100)
    object_id: Optional[str] = Field(None, max_length=100)
    score: Optional[float] = Field(None, ge=0.0, le=1.0)
    duration_ms: Optional[int] = Field(None, ge=0)
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('score')
    def validate_score(cls, v):
        """Validate score is between 0 and 1 if provided."""
        if v is not None and (v < 0.0 or v > 1.0):
            raise ValueError('Score must be between 0.0 and 1.0')
        return v
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat() + 'Z',
            UUID: str
        }