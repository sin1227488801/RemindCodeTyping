"""
Pytest configuration and shared fixtures for all tests.

This module provides common test fixtures and configuration for both
unit and integration tests.
"""

import asyncio
import pytest
import pytest_asyncio
from datetime import datetime
from uuid import uuid4
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from httpx import AsyncClient

from main import app
from infra.database import DatabaseConfig, Base, get_database_config, init_database
from domain.models import User, StudyBook, Question, TypingLog, LearningEvent


# Test database configuration
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_db() -> AsyncGenerator[DatabaseConfig, None]:
    """Create a test database for each test function."""
    # Initialize test database
    db_config = DatabaseConfig(TEST_DATABASE_URL)
    
    # Create all tables
    Base.metadata.create_all(bind=db_config.engine)
    
    # Connect to database
    await db_config.connect()
    
    try:
        yield db_config
    finally:
        # Clean up
        await db_config.disconnect()
        Base.metadata.drop_all(bind=db_config.engine)


@pytest.fixture
def test_client() -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI application."""
    with TestClient(app) as client:
        yield client


@pytest_asyncio.fixture
async def async_test_client(test_db: DatabaseConfig) -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client for the FastAPI application."""
    # Override the database dependency
    def override_get_database():
        return test_db.database
    
    app.dependency_overrides[get_database_config] = lambda: test_db
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    # Clean up dependency override
    app.dependency_overrides.clear()


# Sample data fixtures
@pytest.fixture
def sample_user() -> User:
    """Create a sample user for testing."""
    return User(
        id=uuid4(),
        name="Test User",
        email="test@example.com",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def sample_user_2() -> User:
    """Create a second sample user for testing."""
    return User(
        id=uuid4(),
        name="Another User",
        email="another@example.com",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def sample_study_book(sample_user: User) -> StudyBook:
    """Create a sample study book for testing."""
    return StudyBook(
        id=uuid4(),
        user_id=sample_user.id,
        title="Python Programming",
        description="Learn Python basics",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def sample_question(sample_study_book: StudyBook) -> Question:
    """Create a sample question for testing."""
    return Question(
        id=uuid4(),
        study_book_id=sample_study_book.id,
        language="Python",
        category="Syntax",
        difficulty="easy",
        question="What is a variable?",
        answer="A variable is a storage location with a name.",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def sample_typing_log(sample_user: User, sample_question: Question) -> TypingLog:
    """Create a sample typing log for testing."""
    return TypingLog(
        id=uuid4(),
        user_id=sample_user.id,
        question_id=sample_question.id,
        wpm=45,
        accuracy=0.95,
        took_ms=30000,
        created_at=datetime.utcnow()
    )


@pytest.fixture
def sample_learning_event(sample_user: User) -> LearningEvent:
    """Create a sample learning event for testing."""
    return LearningEvent(
        id=uuid4(),
        user_id=str(sample_user.id),
        app_id="typing-app",
        action="question_answered",
        object_id=str(uuid4()),
        score=0.85,
        duration_ms=15000,
        occurred_at=datetime.utcnow()
    )


# Database helper fixtures
@pytest_asyncio.fixture
async def db_with_user(test_db: DatabaseConfig, sample_user: User) -> User:
    """Create a test database with a user."""
    from infra.repositories import SQLAlchemyUserRepository
    
    user_repo = SQLAlchemyUserRepository(test_db.database)
    created_user = await user_repo.create(sample_user)
    return created_user


@pytest_asyncio.fixture
async def db_with_study_book(test_db: DatabaseConfig, sample_user: User, sample_study_book: StudyBook) -> StudyBook:
    """Create a test database with a user and study book."""
    from infra.repositories import SQLAlchemyUserRepository, SQLAlchemyStudyBookRepository
    
    # Create user first
    user_repo = SQLAlchemyUserRepository(test_db.database)
    await user_repo.create(sample_user)
    
    # Create study book
    study_book_repo = SQLAlchemyStudyBookRepository(test_db.database)
    created_study_book = await study_book_repo.create(sample_study_book)
    return created_study_book


@pytest_asyncio.fixture
async def db_with_question(
    test_db: DatabaseConfig, 
    sample_user: User, 
    sample_study_book: StudyBook, 
    sample_question: Question
) -> Question:
    """Create a test database with a user, study book, and question."""
    from infra.repositories import (
        SQLAlchemyUserRepository, 
        SQLAlchemyStudyBookRepository, 
        SQLAlchemyQuestionRepository
    )
    
    # Create user
    user_repo = SQLAlchemyUserRepository(test_db.database)
    await user_repo.create(sample_user)
    
    # Create study book
    study_book_repo = SQLAlchemyStudyBookRepository(test_db.database)
    await study_book_repo.create(sample_study_book)
    
    # Create question
    question_repo = SQLAlchemyQuestionRepository(test_db.database)
    created_question = await question_repo.create(sample_question)
    return created_question


# Authentication helper fixtures
@pytest.fixture
def auth_headers(sample_user: User) -> dict:
    """Create authentication headers for testing."""
    return {"X-User-Id": str(sample_user.id)}


@pytest.fixture
def auth_headers_2(sample_user_2: User) -> dict:
    """Create authentication headers for second user."""
    return {"X-User-Id": str(sample_user_2.id)}


# Test data factories
class TestDataFactory:
    """Factory for creating test data."""
    
    @staticmethod
    def create_user(name: str = "Test User", email: str = "test@example.com") -> User:
        """Create a user with custom data."""
        return User(
            id=uuid4(),
            name=name,
            email=email,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    @staticmethod
    def create_study_book(user_id: str, title: str = "Test Study Book", description: str = None) -> StudyBook:
        """Create a study book with custom data."""
        return StudyBook(
            id=uuid4(),
            user_id=user_id,
            title=title,
            description=description,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    @staticmethod
    def create_question(
        study_book_id: str, 
        language: str = "Python", 
        category: str = "Syntax",
        difficulty: str = "easy",
        question: str = "Test question?",
        answer: str = "Test answer."
    ) -> Question:
        """Create a question with custom data."""
        return Question(
            id=uuid4(),
            study_book_id=study_book_id,
            language=language,
            category=category,
            difficulty=difficulty,
            question=question,
            answer=answer,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )


@pytest.fixture
def test_data_factory() -> TestDataFactory:
    """Provide test data factory."""
    return TestDataFactory()