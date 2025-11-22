"""
Domain value objects for encapsulating business rules and validation.

Value objects are immutable objects that represent concepts in the domain
and contain validation logic and business rules.
"""

from typing import ClassVar
from uuid import UUID

from pydantic import BaseModel, Field, validator


class Email(BaseModel):
    """Email value object with validation."""
    
    value: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    
    @validator('value')
    def normalize_email(cls, v):
        """Normalize email to lowercase."""
        return v.lower().strip()
    
    def __str__(self) -> str:
        return self.value
    
    class Config:
        frozen = True


class Difficulty(BaseModel):
    """Difficulty level value object with validation."""
    
    VALID_LEVELS: ClassVar[set[str]] = {'easy', 'medium', 'hard'}
    
    value: str = Field(..., pattern=r'^(easy|medium|hard)$')
    
    @validator('value')
    def validate_difficulty_level(cls, v):
        """Validate difficulty is one of the allowed levels."""
        if v not in cls.VALID_LEVELS:
            raise ValueError(f'Difficulty must be one of: {", ".join(cls.VALID_LEVELS)}')
        return v
    
    def __str__(self) -> str:
        return self.value
    
    @classmethod
    def easy(cls) -> 'Difficulty':
        """Create easy difficulty."""
        return cls(value='easy')
    
    @classmethod
    def medium(cls) -> 'Difficulty':
        """Create medium difficulty."""
        return cls(value='medium')
    
    @classmethod
    def hard(cls) -> 'Difficulty':
        """Create hard difficulty."""
        return cls(value='hard')
    
    class Config:
        frozen = True


class TypingPerformance(BaseModel):
    """Typing performance value object with validation."""
    
    wpm: int = Field(..., ge=0, le=1000)
    accuracy: float = Field(..., ge=0.0, le=1.0)
    duration_ms: int = Field(..., ge=0)
    
    @validator('wpm')
    def validate_wpm_range(cls, v):
        """Validate WPM is within reasonable bounds."""
        if v < 0 or v > 1000:
            raise ValueError('WPM must be between 0 and 1000')
        return v
    
    @validator('accuracy')
    def validate_accuracy_percentage(cls, v):
        """Validate accuracy is a valid percentage."""
        if v < 0.0 or v > 1.0:
            raise ValueError('Accuracy must be between 0.0 and 1.0 (0% to 100%)')
        return v
    
    @validator('duration_ms')
    def validate_positive_duration(cls, v):
        """Validate duration is positive."""
        if v < 0:
            raise ValueError('Duration must be positive')
        return v
    
    @property
    def accuracy_percentage(self) -> float:
        """Get accuracy as percentage (0-100)."""
        return self.accuracy * 100
    
    @property
    def duration_seconds(self) -> float:
        """Get duration in seconds."""
        return self.duration_ms / 1000
    
    def is_excellent_performance(self) -> bool:
        """Check if this represents excellent typing performance."""
        return self.wpm >= 60 and self.accuracy >= 0.95
    
    def is_good_performance(self) -> bool:
        """Check if this represents good typing performance."""
        return self.wpm >= 40 and self.accuracy >= 0.90
    
    class Config:
        frozen = True


# Note: ID value objects removed for simplicity - UUID provides sufficient type safety


class SearchQuery(BaseModel):
    """Search query value object with validation."""
    
    text: str = Field(..., min_length=1, max_length=500)
    
    @validator('text')
    def normalize_query(cls, v):
        """Normalize search query."""
        return v.strip()
    
    def __str__(self) -> str:
        return self.text
    
    @property
    def is_empty(self) -> bool:
        """Check if query is effectively empty."""
        return len(self.text.strip()) == 0
    
    @property
    def word_count(self) -> int:
        """Get number of words in query."""
        return len(self.text.split())
    
    class Config:
        frozen = True