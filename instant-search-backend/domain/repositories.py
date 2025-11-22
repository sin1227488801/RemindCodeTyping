"""
Repository interfaces for the domain layer.

This module defines abstract base classes for data access,
following the repository pattern to maintain separation between
domain logic and infrastructure concerns.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from .models import User, StudyBook, Question, TypingLog, LearningEvent


class UserRepository(ABC):
    """Abstract repository interface for User entities."""
    
    @abstractmethod
    async def create(self, user: User) -> User:
        """
        Create a new user.
        
        Args:
            user: User entity to create
            
        Returns:
            Created user entity
            
        Raises:
            DomainException: If user creation fails
        """
        pass
    
    @abstractmethod
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            user_id: User identifier
            
        Returns:
            User entity if found, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email address.
        
        Args:
            email: User email address
            
        Returns:
            User entity if found, None otherwise
        """
        pass
    
    @abstractmethod
    async def update(self, user: User) -> User:
        """
        Update an existing user.
        
        Args:
            user: User entity with updated data
            
        Returns:
            Updated user entity
            
        Raises:
            UserNotFoundError: If user doesn't exist
        """
        pass
    
    @abstractmethod
    async def delete(self, user_id: UUID) -> bool:
        """
        Delete a user by ID.
        
        Args:
            user_id: User identifier
            
        Returns:
            True if user was deleted, False if not found
        """
        pass


class StudyBookRepository(ABC):
    """Abstract repository interface for StudyBook entities."""
    
    @abstractmethod
    async def create(self, study_book: StudyBook) -> StudyBook:
        """
        Create a new study book.
        
        Args:
            study_book: StudyBook entity to create
            
        Returns:
            Created study book entity
            
        Raises:
            DomainException: If study book creation fails
        """
        pass
    
    @abstractmethod
    async def get_by_id(self, study_book_id: UUID, user_id: UUID) -> Optional[StudyBook]:
        """
        Get study book by ID, scoped to user.
        
        Args:
            study_book_id: Study book identifier
            user_id: User identifier for access control
            
        Returns:
            StudyBook entity if found and owned by user, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_by_user_id(self, user_id: UUID, limit: Optional[int] = None, offset: Optional[int] = None) -> List[StudyBook]:
        """
        Get all study books for a user.
        
        Args:
            user_id: User identifier
            limit: Maximum number of results to return
            offset: Number of results to skip
            
        Returns:
            List of study books owned by the user
        """
        pass
    
    @abstractmethod
    async def update(self, study_book: StudyBook) -> StudyBook:
        """
        Update an existing study book.
        
        Args:
            study_book: StudyBook entity with updated data
            
        Returns:
            Updated study book entity
            
        Raises:
            StudyBookNotFoundError: If study book doesn't exist
            UnauthorizedAccessError: If user doesn't own the study book
        """
        pass
    
    @abstractmethod
    async def delete(self, study_book_id: UUID, user_id: UUID) -> bool:
        """
        Delete a study book by ID, scoped to user.
        
        Args:
            study_book_id: Study book identifier
            user_id: User identifier for access control
            
        Returns:
            True if study book was deleted, False if not found or not owned
        """
        pass
    
    @abstractmethod
    async def count_by_user_id(self, user_id: UUID) -> int:
        """
        Count study books for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Number of study books owned by the user
        """
        pass


class QuestionRepository(ABC):
    """Abstract repository interface for Question entities."""
    
    @abstractmethod
    async def create(self, question: Question) -> Question:
        """
        Create a new question.
        
        Args:
            question: Question entity to create
            
        Returns:
            Created question entity
            
        Raises:
            DomainException: If question creation fails
        """
        pass
    
    @abstractmethod
    async def get_by_id(self, question_id: UUID, user_id: UUID) -> Optional[Question]:
        """
        Get question by ID, scoped to user through study book ownership.
        
        Args:
            question_id: Question identifier
            user_id: User identifier for access control
            
        Returns:
            Question entity if found and accessible by user, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_by_study_book_id(self, study_book_id: UUID, user_id: UUID, limit: Optional[int] = None, offset: Optional[int] = None) -> List[Question]:
        """
        Get all questions for a study book, scoped to user.
        
        Args:
            study_book_id: Study book identifier
            user_id: User identifier for access control
            limit: Maximum number of results to return
            offset: Number of results to skip
            
        Returns:
            List of questions in the study book
        """
        pass
    
    @abstractmethod
    async def get_random_by_study_book_id(self, study_book_id: UUID, user_id: UUID) -> Optional[Question]:
        """
        Get a random question from a study book, scoped to user.
        
        Args:
            study_book_id: Study book identifier
            user_id: User identifier for access control
            
        Returns:
            Random question from the study book if any exist, None otherwise
        """
        pass
    
    @abstractmethod
    async def update(self, question: Question, user_id: UUID) -> Question:
        """
        Update an existing question.
        
        Args:
            question: Question entity with updated data
            user_id: User identifier for access control
            
        Returns:
            Updated question entity
            
        Raises:
            QuestionNotFoundError: If question doesn't exist
            UnauthorizedAccessError: If user doesn't own the question's study book
        """
        pass
    
    @abstractmethod
    async def delete(self, question_id: UUID, user_id: UUID) -> bool:
        """
        Delete a question by ID, scoped to user.
        
        Args:
            question_id: Question identifier
            user_id: User identifier for access control
            
        Returns:
            True if question was deleted, False if not found or not accessible
        """
        pass
    
    @abstractmethod
    async def count_by_study_book_id(self, study_book_id: UUID, user_id: UUID) -> int:
        """
        Count questions in a study book, scoped to user.
        
        Args:
            study_book_id: Study book identifier
            user_id: User identifier for access control
            
        Returns:
            Number of questions in the study book
        """
        pass


class TypingLogRepository(ABC):
    """Abstract repository interface for TypingLog entities."""
    
    @abstractmethod
    async def create(self, typing_log: TypingLog) -> TypingLog:
        """
        Create a new typing log entry.
        
        Args:
            typing_log: TypingLog entity to create
            
        Returns:
            Created typing log entity
            
        Raises:
            DomainException: If typing log creation fails
        """
        pass
    
    @abstractmethod
    async def get_by_id(self, typing_log_id: UUID, user_id: UUID) -> Optional[TypingLog]:
        """
        Get typing log by ID, scoped to user.
        
        Args:
            typing_log_id: Typing log identifier
            user_id: User identifier for access control
            
        Returns:
            TypingLog entity if found and owned by user, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_by_user_id(self, user_id: UUID, limit: Optional[int] = None, offset: Optional[int] = None) -> List[TypingLog]:
        """
        Get typing logs for a user, ordered by creation time (newest first).
        
        Args:
            user_id: User identifier
            limit: Maximum number of results to return
            offset: Number of results to skip
            
        Returns:
            List of typing logs for the user
        """
        pass
    
    @abstractmethod
    async def get_by_question_id(self, question_id: UUID, user_id: UUID, limit: Optional[int] = None, offset: Optional[int] = None) -> List[TypingLog]:
        """
        Get typing logs for a specific question, scoped to user.
        
        Args:
            question_id: Question identifier
            user_id: User identifier for access control
            limit: Maximum number of results to return
            offset: Number of results to skip
            
        Returns:
            List of typing logs for the question
        """
        pass
    
    @abstractmethod
    async def count_by_user_id(self, user_id: UUID) -> int:
        """
        Count typing logs for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Number of typing logs for the user
        """
        pass


class LearningEventRepository(ABC):
    """Abstract repository interface for LearningEvent entities."""
    
    @abstractmethod
    async def create(self, learning_event: LearningEvent) -> LearningEvent:
        """
        Create a new learning event.
        
        Args:
            learning_event: LearningEvent entity to create
            
        Returns:
            Created learning event entity
            
        Raises:
            DomainException: If learning event creation fails
        """
        pass
    
    @abstractmethod
    async def get_by_id(self, event_id: UUID, user_id: str) -> Optional[LearningEvent]:
        """
        Get learning event by ID, scoped to user.
        
        Args:
            event_id: Learning event identifier
            user_id: User identifier for access control
            
        Returns:
            LearningEvent entity if found and owned by user, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_by_user_id(self, user_id: str, limit: Optional[int] = None, offset: Optional[int] = None) -> List[LearningEvent]:
        """
        Get learning events for a user, ordered by occurrence time (newest first).
        
        Args:
            user_id: User identifier
            limit: Maximum number of results to return
            offset: Number of results to skip
            
        Returns:
            List of learning events for the user
        """
        pass
    
    @abstractmethod
    async def get_by_action(self, user_id: str, action: str, limit: Optional[int] = None, offset: Optional[int] = None) -> List[LearningEvent]:
        """
        Get learning events for a user filtered by action type.
        
        Args:
            user_id: User identifier
            action: Action type to filter by
            limit: Maximum number of results to return
            offset: Number of results to skip
            
        Returns:
            List of learning events matching the action
        """
        pass
    
    @abstractmethod
    async def count_by_user_id(self, user_id: str) -> int:
        """
        Count learning events for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Number of learning events for the user
        """
        pass