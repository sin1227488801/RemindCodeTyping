"""
Unit tests for domain models.

Tests domain model validation, business rules, and data integrity.
"""

import pytest
from datetime import datetime
from uuid import UUID, uuid4
from pydantic import ValidationError

from domain.models import User, StudyBook, Question, TypingLog, LearningEvent


class TestUser:
    """Test cases for User domain model."""
    
    def test_user_creation_with_valid_data(self):
        """Test creating a user with valid data."""
        user = User(
            name="John Doe",
            email="john.doe@example.com"
        )
        
        assert isinstance(user.id, UUID)
        assert user.name == "John Doe"
        assert user.email == "john.doe@example.com"
        assert isinstance(user.created_at, datetime)
        assert isinstance(user.updated_at, datetime)
    
    def test_user_email_lowercase_validation(self):
        """Test that email is automatically converted to lowercase."""
        user = User(
            name="John Doe",
            email="JOHN.DOE@EXAMPLE.COM"
        )
        
        assert user.email == "john.doe@example.com"
    
    def test_user_name_validation_empty(self):
        """Test that empty name raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            User(name="", email="john@example.com")
        
        assert "String should have at least 1 character" in str(exc_info.value)
    
    def test_user_name_validation_too_long(self):
        """Test that name longer than 100 characters raises validation error."""
        long_name = "a" * 101
        with pytest.raises(ValidationError) as exc_info:
            User(name=long_name, email="john@example.com")
        
        assert "String should have at most 100 characters" in str(exc_info.value)
    
    def test_user_email_validation_invalid_format(self):
        """Test that invalid email format raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            User(name="John Doe", email="invalid-email")
        
        assert "String should match pattern" in str(exc_info.value)
    
    def test_user_json_serialization(self):
        """Test that user can be serialized to JSON with proper format."""
        user = User(
            name="John Doe",
            email="john@example.com"
        )
        
        json_data = user.model_dump()
        
        assert json_data["name"] == "John Doe"
        assert json_data["email"] == "john@example.com"
        assert isinstance(json_data["id"], UUID)  # UUID object in model_dump
        assert isinstance(json_data["created_at"], datetime)


class TestStudyBook:
    """Test cases for StudyBook domain model."""
    
    def test_study_book_creation_with_valid_data(self):
        """Test creating a study book with valid data."""
        user_id = uuid4()
        study_book = StudyBook(
            user_id=user_id,
            title="Python Programming",
            description="Learn Python basics"
        )
        
        assert isinstance(study_book.id, UUID)
        assert study_book.user_id == user_id
        assert study_book.title == "Python Programming"
        assert study_book.description == "Learn Python basics"
        assert isinstance(study_book.created_at, datetime)
        assert isinstance(study_book.updated_at, datetime)
    
    def test_study_book_creation_without_description(self):
        """Test creating a study book without description."""
        user_id = uuid4()
        study_book = StudyBook(
            user_id=user_id,
            title="Python Programming"
        )
        
        assert study_book.description is None
    
    def test_study_book_title_validation_empty(self):
        """Test that empty title raises validation error."""
        user_id = uuid4()
        with pytest.raises(ValidationError) as exc_info:
            StudyBook(user_id=user_id, title="")
        
        assert "String should have at least 1 character" in str(exc_info.value)
    
    def test_study_book_title_validation_too_long(self):
        """Test that title longer than 200 characters raises validation error."""
        user_id = uuid4()
        long_title = "a" * 201
        with pytest.raises(ValidationError) as exc_info:
            StudyBook(user_id=user_id, title=long_title)
        
        assert "String should have at most 200 characters" in str(exc_info.value)
    
    def test_study_book_description_validation_too_long(self):
        """Test that description longer than 1000 characters raises validation error."""
        user_id = uuid4()
        long_description = "a" * 1001
        with pytest.raises(ValidationError) as exc_info:
            StudyBook(user_id=user_id, title="Valid Title", description=long_description)
        
        assert "String should have at most 1000 characters" in str(exc_info.value)


class TestQuestion:
    """Test cases for Question domain model."""
    
    def test_question_creation_with_valid_data(self):
        """Test creating a question with valid data."""
        study_book_id = uuid4()
        question = Question(
            study_book_id=study_book_id,
            language="Python",
            category="Syntax",
            difficulty="easy",
            question="What is a variable?",
            answer="A variable is a storage location with a name."
        )
        
        assert isinstance(question.id, UUID)
        assert question.study_book_id == study_book_id
        assert question.language == "Python"
        assert question.category == "Syntax"
        assert question.difficulty == "easy"
        assert question.question == "What is a variable?"
        assert question.answer == "A variable is a storage location with a name."
        assert isinstance(question.created_at, datetime)
        assert isinstance(question.updated_at, datetime)
    
    def test_question_difficulty_validation_valid_values(self):
        """Test that valid difficulty values are accepted."""
        study_book_id = uuid4()
        
        for difficulty in ["easy", "medium", "hard"]:
            question = Question(
                study_book_id=study_book_id,
                language="Python",
                category="Syntax",
                difficulty=difficulty,
                question="Test question",
                answer="Test answer"
            )
            assert question.difficulty == difficulty
    
    def test_question_difficulty_validation_invalid_value(self):
        """Test that invalid difficulty value raises validation error."""
        study_book_id = uuid4()
        with pytest.raises(ValidationError) as exc_info:
            Question(
                study_book_id=study_book_id,
                language="Python",
                category="Syntax",
                difficulty="invalid",
                question="Test question",
                answer="Test answer"
            )
        
        assert "String should match pattern" in str(exc_info.value)
    
    def test_question_field_length_validations(self):
        """Test field length validations for question fields."""
        study_book_id = uuid4()
        
        # Test empty language
        with pytest.raises(ValidationError):
            Question(
                study_book_id=study_book_id,
                language="",
                category="Syntax",
                difficulty="easy",
                question="Test question",
                answer="Test answer"
            )
        
        # Test empty question
        with pytest.raises(ValidationError):
            Question(
                study_book_id=study_book_id,
                language="Python",
                category="Syntax",
                difficulty="easy",
                question="",
                answer="Test answer"
            )
        
        # Test empty answer
        with pytest.raises(ValidationError):
            Question(
                study_book_id=study_book_id,
                language="Python",
                category="Syntax",
                difficulty="easy",
                question="Test question",
                answer=""
            )


class TestTypingLog:
    """Test cases for TypingLog domain model."""
    
    def test_typing_log_creation_with_valid_data(self):
        """Test creating a typing log with valid data."""
        user_id = uuid4()
        question_id = uuid4()
        typing_log = TypingLog(
            user_id=user_id,
            question_id=question_id,
            wpm=45,
            accuracy=0.95,
            took_ms=30000
        )
        
        assert isinstance(typing_log.id, UUID)
        assert typing_log.user_id == user_id
        assert typing_log.question_id == question_id
        assert typing_log.wpm == 45
        assert typing_log.accuracy == 0.95
        assert typing_log.took_ms == 30000
        assert isinstance(typing_log.created_at, datetime)
    
    def test_typing_log_creation_without_question(self):
        """Test creating a typing log without associated question."""
        user_id = uuid4()
        typing_log = TypingLog(
            user_id=user_id,
            wpm=45,
            accuracy=0.95,
            took_ms=30000
        )
        
        assert typing_log.question_id is None
    
    def test_typing_log_wpm_validation(self):
        """Test WPM validation rules."""
        user_id = uuid4()
        
        # Test negative WPM
        with pytest.raises(ValidationError) as exc_info:
            TypingLog(
                user_id=user_id,
                wpm=-1,
                accuracy=0.95,
                took_ms=30000
            )
        assert "Input should be greater than or equal to 0" in str(exc_info.value)
        
        # Test WPM too high
        with pytest.raises(ValidationError) as exc_info:
            TypingLog(
                user_id=user_id,
                wpm=1001,
                accuracy=0.95,
                took_ms=30000
            )
        assert "Input should be less than or equal to 1000" in str(exc_info.value)
        
        # Test valid boundary values
        TypingLog(user_id=user_id, wpm=0, accuracy=0.95, took_ms=30000)
        TypingLog(user_id=user_id, wpm=1000, accuracy=0.95, took_ms=30000)
    
    def test_typing_log_accuracy_validation(self):
        """Test accuracy validation rules."""
        user_id = uuid4()
        
        # Test negative accuracy
        with pytest.raises(ValidationError) as exc_info:
            TypingLog(
                user_id=user_id,
                wpm=45,
                accuracy=-0.1,
                took_ms=30000
            )
        assert "Input should be greater than or equal to 0" in str(exc_info.value)
        
        # Test accuracy too high
        with pytest.raises(ValidationError) as exc_info:
            TypingLog(
                user_id=user_id,
                wpm=45,
                accuracy=1.1,
                took_ms=30000
            )
        assert "Input should be less than or equal to 1" in str(exc_info.value)
        
        # Test valid boundary values
        TypingLog(user_id=user_id, wpm=45, accuracy=0.0, took_ms=30000)
        TypingLog(user_id=user_id, wpm=45, accuracy=1.0, took_ms=30000)
    
    def test_typing_log_took_ms_validation(self):
        """Test took_ms validation rules."""
        user_id = uuid4()
        
        # Test negative took_ms
        with pytest.raises(ValidationError):
            TypingLog(
                user_id=user_id,
                wpm=45,
                accuracy=0.95,
                took_ms=-1
            )
        
        # Test valid boundary value
        TypingLog(user_id=user_id, wpm=45, accuracy=0.95, took_ms=0)


class TestLearningEvent:
    """Test cases for LearningEvent domain model."""
    
    def test_learning_event_creation_with_valid_data(self):
        """Test creating a learning event with valid data."""
        learning_event = LearningEvent(
            user_id="user123",
            app_id="typing-app",
            action="question_answered",
            object_id="question456",
            score=0.85,
            duration_ms=15000
        )
        
        assert isinstance(learning_event.id, UUID)
        assert learning_event.user_id == "user123"
        assert learning_event.app_id == "typing-app"
        assert learning_event.action == "question_answered"
        assert learning_event.object_id == "question456"
        assert learning_event.score == 0.85
        assert learning_event.duration_ms == 15000
        assert isinstance(learning_event.occurred_at, datetime)
    
    def test_learning_event_creation_minimal_data(self):
        """Test creating a learning event with minimal required data."""
        learning_event = LearningEvent(
            user_id="user123",
            app_id="typing-app",
            action="session_started"
        )
        
        assert learning_event.object_id is None
        assert learning_event.score is None
        assert learning_event.duration_ms is None
    
    def test_learning_event_score_validation(self):
        """Test score validation rules."""
        # Test negative score
        with pytest.raises(ValidationError) as exc_info:
            LearningEvent(
                user_id="user123",
                app_id="typing-app",
                action="test",
                score=-0.1
            )
        assert "Input should be greater than or equal to 0" in str(exc_info.value)
        
        # Test score too high
        with pytest.raises(ValidationError) as exc_info:
            LearningEvent(
                user_id="user123",
                app_id="typing-app",
                action="test",
                score=1.1
            )
        assert "Input should be less than or equal to 1" in str(exc_info.value)
        
        # Test valid boundary values
        LearningEvent(user_id="user123", app_id="typing-app", action="test", score=0.0)
        LearningEvent(user_id="user123", app_id="typing-app", action="test", score=1.0)
    
    def test_learning_event_field_validations(self):
        """Test field validation rules."""
        # Test empty user_id
        with pytest.raises(ValidationError):
            LearningEvent(
                user_id="",
                app_id="typing-app",
                action="test"
            )
        
        # Test empty app_id
        with pytest.raises(ValidationError):
            LearningEvent(
                user_id="user123",
                app_id="",
                action="test"
            )
        
        # Test empty action
        with pytest.raises(ValidationError):
            LearningEvent(
                user_id="user123",
                app_id="typing-app",
                action=""
            )
        
        # Test negative duration_ms
        with pytest.raises(ValidationError):
            LearningEvent(
                user_id="user123",
                app_id="typing-app",
                action="test",
                duration_ms=-1
            )