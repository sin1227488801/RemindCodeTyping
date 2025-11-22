"""
Unit tests for repository interfaces.

Tests repository interface contracts using mocks to ensure proper behavior
without depending on infrastructure implementations.
"""

import pytest
from unittest.mock import AsyncMock, Mock
from uuid import uuid4
from datetime import datetime
from typing import List, Optional

from domain.repositories import (
    UserRepository,
    StudyBookRepository,
    QuestionRepository,
    TypingLogRepository,
    LearningEventRepository
)
from domain.models import User, StudyBook, Question, TypingLog, LearningEvent
from domain.exceptions import UserNotFoundError, StudyBookNotFoundError


class MockUserRepository(UserRepository):
    """Mock implementation of UserRepository for testing."""
    
    def __init__(self):
        self.users = {}
        self.create_mock = AsyncMock()
        self.get_by_id_mock = AsyncMock()
        self.get_by_email_mock = AsyncMock()
        self.update_mock = AsyncMock()
        self.delete_mock = AsyncMock()
    
    async def create(self, user: User) -> User:
        result = await self.create_mock(user)
        self.users[user.id] = user
        return result or user
    
    async def get_by_id(self, user_id) -> Optional[User]:
        result = await self.get_by_id_mock(user_id)
        return result
    
    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.get_by_email_mock(email)
        return result
    
    async def update(self, user: User) -> User:
        result = await self.update_mock(user)
        return result or user
    
    async def delete(self, user_id) -> bool:
        result = await self.delete_mock(user_id)
        return result if result is not None else True


class MockStudyBookRepository(StudyBookRepository):
    """Mock implementation of StudyBookRepository for testing."""
    
    def __init__(self):
        self.study_books = {}
        self.create_mock = AsyncMock()
        self.get_by_id_mock = AsyncMock()
        self.get_by_user_id_mock = AsyncMock()
        self.update_mock = AsyncMock()
        self.delete_mock = AsyncMock()
        self.count_by_user_id_mock = AsyncMock()
    
    async def create(self, study_book: StudyBook) -> StudyBook:
        result = await self.create_mock(study_book)
        self.study_books[study_book.id] = study_book
        return result or study_book
    
    async def get_by_id(self, study_book_id, user_id) -> Optional[StudyBook]:
        result = await self.get_by_id_mock(study_book_id, user_id)
        return result
    
    async def get_by_user_id(self, user_id, limit=None, offset=None) -> List[StudyBook]:
        result = await self.get_by_user_id_mock(user_id, limit, offset)
        return result or []
    
    async def update(self, study_book: StudyBook) -> StudyBook:
        result = await self.update_mock(study_book)
        return result or study_book
    
    async def delete(self, study_book_id, user_id) -> bool:
        result = await self.delete_mock(study_book_id, user_id)
        return result if result is not None else True
    
    async def count_by_user_id(self, user_id) -> int:
        result = await self.count_by_user_id_mock(user_id)
        return result if result is not None else 0


class TestUserRepositoryContract:
    """Test cases for UserRepository interface contract."""
    
    @pytest.fixture
    def user_repo(self):
        """Fixture providing a mock user repository."""
        return MockUserRepository()
    
    @pytest.fixture
    def sample_user(self):
        """Fixture providing a sample user."""
        return User(
            id=uuid4(),
            name="John Doe",
            email="john@example.com",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    @pytest.mark.asyncio
    async def test_create_user(self, user_repo, sample_user):
        """Test creating a user through repository."""
        user_repo.create_mock.return_value = sample_user
        
        result = await user_repo.create(sample_user)
        
        assert result == sample_user
        user_repo.create_mock.assert_called_once_with(sample_user)
        assert sample_user.id in user_repo.users
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_found(self, user_repo, sample_user):
        """Test getting a user by ID when user exists."""
        user_repo.get_by_id_mock.return_value = sample_user
        
        result = await user_repo.get_by_id(sample_user.id)
        
        assert result == sample_user
        user_repo.get_by_id_mock.assert_called_once_with(sample_user.id)
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(self, user_repo):
        """Test getting a user by ID when user doesn't exist."""
        user_id = uuid4()
        user_repo.get_by_id_mock.return_value = None
        
        result = await user_repo.get_by_id(user_id)
        
        assert result is None
        user_repo.get_by_id_mock.assert_called_once_with(user_id)
    
    @pytest.mark.asyncio
    async def test_get_user_by_email_found(self, user_repo, sample_user):
        """Test getting a user by email when user exists."""
        user_repo.get_by_email_mock.return_value = sample_user
        
        result = await user_repo.get_by_email(sample_user.email)
        
        assert result == sample_user
        user_repo.get_by_email_mock.assert_called_once_with(sample_user.email)
    
    @pytest.mark.asyncio
    async def test_get_user_by_email_not_found(self, user_repo):
        """Test getting a user by email when user doesn't exist."""
        email = "nonexistent@example.com"
        user_repo.get_by_email_mock.return_value = None
        
        result = await user_repo.get_by_email(email)
        
        assert result is None
        user_repo.get_by_email_mock.assert_called_once_with(email)
    
    @pytest.mark.asyncio
    async def test_update_user(self, user_repo, sample_user):
        """Test updating a user through repository."""
        updated_user = sample_user.model_copy(update={"name": "Jane Doe"})
        user_repo.update_mock.return_value = updated_user
        
        result = await user_repo.update(updated_user)
        
        assert result == updated_user
        user_repo.update_mock.assert_called_once_with(updated_user)
    
    @pytest.mark.asyncio
    async def test_delete_user_success(self, user_repo, sample_user):
        """Test deleting a user successfully."""
        user_repo.delete_mock.return_value = True
        
        result = await user_repo.delete(sample_user.id)
        
        assert result is True
        user_repo.delete_mock.assert_called_once_with(sample_user.id)
    
    @pytest.mark.asyncio
    async def test_delete_user_not_found(self, user_repo):
        """Test deleting a user that doesn't exist."""
        user_id = uuid4()
        user_repo.delete_mock.return_value = False
        
        result = await user_repo.delete(user_id)
        
        assert result is False
        user_repo.delete_mock.assert_called_once_with(user_id)


class TestStudyBookRepositoryContract:
    """Test cases for StudyBookRepository interface contract."""
    
    @pytest.fixture
    def study_book_repo(self):
        """Fixture providing a mock study book repository."""
        return MockStudyBookRepository()
    
    @pytest.fixture
    def sample_study_book(self):
        """Fixture providing a sample study book."""
        return StudyBook(
            id=uuid4(),
            user_id=uuid4(),
            title="Python Programming",
            description="Learn Python basics",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    @pytest.mark.asyncio
    async def test_create_study_book(self, study_book_repo, sample_study_book):
        """Test creating a study book through repository."""
        study_book_repo.create_mock.return_value = sample_study_book
        
        result = await study_book_repo.create(sample_study_book)
        
        assert result == sample_study_book
        study_book_repo.create_mock.assert_called_once_with(sample_study_book)
        assert sample_study_book.id in study_book_repo.study_books
    
    @pytest.mark.asyncio
    async def test_get_study_book_by_id_found(self, study_book_repo, sample_study_book):
        """Test getting a study book by ID when it exists and user owns it."""
        study_book_repo.get_by_id_mock.return_value = sample_study_book
        
        result = await study_book_repo.get_by_id(sample_study_book.id, sample_study_book.user_id)
        
        assert result == sample_study_book
        study_book_repo.get_by_id_mock.assert_called_once_with(sample_study_book.id, sample_study_book.user_id)
    
    @pytest.mark.asyncio
    async def test_get_study_book_by_id_not_found(self, study_book_repo):
        """Test getting a study book by ID when it doesn't exist."""
        study_book_id = uuid4()
        user_id = uuid4()
        study_book_repo.get_by_id_mock.return_value = None
        
        result = await study_book_repo.get_by_id(study_book_id, user_id)
        
        assert result is None
        study_book_repo.get_by_id_mock.assert_called_once_with(study_book_id, user_id)
    
    @pytest.mark.asyncio
    async def test_get_study_books_by_user_id(self, study_book_repo, sample_study_book):
        """Test getting study books by user ID."""
        study_books = [sample_study_book]
        study_book_repo.get_by_user_id_mock.return_value = study_books
        
        result = await study_book_repo.get_by_user_id(sample_study_book.user_id)
        
        assert result == study_books
        study_book_repo.get_by_user_id_mock.assert_called_once_with(sample_study_book.user_id, None, None)
    
    @pytest.mark.asyncio
    async def test_get_study_books_by_user_id_with_pagination(self, study_book_repo, sample_study_book):
        """Test getting study books by user ID with pagination."""
        study_books = [sample_study_book]
        study_book_repo.get_by_user_id_mock.return_value = study_books
        
        result = await study_book_repo.get_by_user_id(sample_study_book.user_id, limit=10, offset=0)
        
        assert result == study_books
        study_book_repo.get_by_user_id_mock.assert_called_once_with(sample_study_book.user_id, 10, 0)
    
    @pytest.mark.asyncio
    async def test_update_study_book(self, study_book_repo, sample_study_book):
        """Test updating a study book through repository."""
        updated_study_book = sample_study_book.model_copy(update={"title": "Advanced Python"})
        study_book_repo.update_mock.return_value = updated_study_book
        
        result = await study_book_repo.update(updated_study_book)
        
        assert result == updated_study_book
        study_book_repo.update_mock.assert_called_once_with(updated_study_book)
    
    @pytest.mark.asyncio
    async def test_delete_study_book_success(self, study_book_repo, sample_study_book):
        """Test deleting a study book successfully."""
        study_book_repo.delete_mock.return_value = True
        
        result = await study_book_repo.delete(sample_study_book.id, sample_study_book.user_id)
        
        assert result is True
        study_book_repo.delete_mock.assert_called_once_with(sample_study_book.id, sample_study_book.user_id)
    
    @pytest.mark.asyncio
    async def test_delete_study_book_not_found(self, study_book_repo):
        """Test deleting a study book that doesn't exist."""
        study_book_id = uuid4()
        user_id = uuid4()
        study_book_repo.delete_mock.return_value = False
        
        result = await study_book_repo.delete(study_book_id, user_id)
        
        assert result is False
        study_book_repo.delete_mock.assert_called_once_with(study_book_id, user_id)
    
    @pytest.mark.asyncio
    async def test_count_study_books_by_user_id(self, study_book_repo, sample_study_book):
        """Test counting study books by user ID."""
        study_book_repo.count_by_user_id_mock.return_value = 5
        
        result = await study_book_repo.count_by_user_id(sample_study_book.user_id)
        
        assert result == 5
        study_book_repo.count_by_user_id_mock.assert_called_once_with(sample_study_book.user_id)


class TestRepositoryInterfaceCompliance:
    """Test cases to ensure repository interfaces are properly defined."""
    
    def test_user_repository_is_abstract(self):
        """Test that UserRepository cannot be instantiated directly."""
        with pytest.raises(TypeError):
            UserRepository()
    
    def test_study_book_repository_is_abstract(self):
        """Test that StudyBookRepository cannot be instantiated directly."""
        with pytest.raises(TypeError):
            StudyBookRepository()
    
    def test_question_repository_is_abstract(self):
        """Test that QuestionRepository cannot be instantiated directly."""
        with pytest.raises(TypeError):
            QuestionRepository()
    
    def test_typing_log_repository_is_abstract(self):
        """Test that TypingLogRepository cannot be instantiated directly."""
        with pytest.raises(TypeError):
            TypingLogRepository()
    
    def test_learning_event_repository_is_abstract(self):
        """Test that LearningEventRepository cannot be instantiated directly."""
        with pytest.raises(TypeError):
            LearningEventRepository()
    
    def test_repository_method_signatures(self):
        """Test that repository interfaces have expected method signatures."""
        # Test UserRepository methods
        user_repo_methods = [
            'create', 'get_by_id', 'get_by_email', 'update', 'delete'
        ]
        for method_name in user_repo_methods:
            assert hasattr(UserRepository, method_name)
            assert callable(getattr(UserRepository, method_name))
        
        # Test StudyBookRepository methods
        study_book_repo_methods = [
            'create', 'get_by_id', 'get_by_user_id', 'update', 'delete', 'count_by_user_id'
        ]
        for method_name in study_book_repo_methods:
            assert hasattr(StudyBookRepository, method_name)
            assert callable(getattr(StudyBookRepository, method_name))
        
        # Test QuestionRepository methods
        question_repo_methods = [
            'create', 'get_by_id', 'get_by_study_book_id', 'get_random_by_study_book_id',
            'update', 'delete', 'count_by_study_book_id'
        ]
        for method_name in question_repo_methods:
            assert hasattr(QuestionRepository, method_name)
            assert callable(getattr(QuestionRepository, method_name))


class TestRepositoryErrorHandling:
    """Test cases for repository error handling patterns."""
    
    @pytest.fixture
    def user_repo(self):
        """Fixture providing a mock user repository."""
        return MockUserRepository()
    
    @pytest.mark.asyncio
    async def test_repository_handles_domain_exceptions(self, user_repo):
        """Test that repositories can raise domain exceptions."""
        user_id = uuid4()
        user_repo.get_by_id_mock.side_effect = UserNotFoundError(user_id)
        
        with pytest.raises(UserNotFoundError) as exc_info:
            await user_repo.get_by_id(user_id)
        
        assert exc_info.value.identifier == user_id
    
    @pytest.mark.asyncio
    async def test_repository_method_call_tracking(self, user_repo):
        """Test that repository method calls are properly tracked."""
        user_id = uuid4()
        user_repo.get_by_id_mock.return_value = None
        
        await user_repo.get_by_id(user_id)
        
        # Verify the mock was called with correct parameters
        user_repo.get_by_id_mock.assert_called_once_with(user_id)
        
        # Verify call count
        assert user_repo.get_by_id_mock.call_count == 1