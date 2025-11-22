"""System problems domain models and types."""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class DifficultyLevel(str, Enum):
    """Difficulty levels for system problems."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class SystemProblem(BaseModel):
    """System problem domain model."""
    question: str = Field(..., description="The problem question/code to type")
    answer: str = Field(..., description="The expected answer/solution")
    difficulty: DifficultyLevel = Field(..., description="Problem difficulty level")
    category: str = Field(..., description="Problem category (e.g., 'functions', 'loops')")
    language: Optional[str] = Field(None, description="Programming language for this problem")

    class Config:
        """Pydantic configuration."""
        use_enum_values = True


class SystemProblemResponse(BaseModel):
    """API response model for system problems."""
    id: str = Field(..., description="Unique identifier for the problem")
    question: str = Field(..., description="The problem question/code to type")
    answer: str = Field(..., description="The expected answer/solution")
    difficulty: str = Field(..., description="Problem difficulty level")
    category: str = Field(..., description="Problem category")
    language: str = Field(..., description="Programming language for this problem")

    @classmethod
    def from_domain(cls, problem: SystemProblem, language: str) -> "SystemProblemResponse":
        """Convert domain model to response model."""
        # Generate stable ID based on language and question hash
        problem_id = f"{language.lower()}_{abs(hash(problem.question)) % 1000000}"
        
        return cls(
            id=problem_id,
            question=problem.question,
            answer=problem.answer,
            difficulty=problem.difficulty.value if isinstance(problem.difficulty, DifficultyLevel) else problem.difficulty,
            category=problem.category,
            language=language
        )