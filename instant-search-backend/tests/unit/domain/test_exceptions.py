"""
Unit tests for domain exceptions.

Tests exception hierarchy, error messages, and exception details.
"""

import pytest
from uuid import uuid4

from domain.exceptions import (
    DomainException,
    ValidationError,
    EntityNotFoundError,
    UserNotFoundError,
    UserEmailAlreadyExistsError,
    StudyBookNotFoundError,
    QuestionNotFoundError,
    TypingLogNotFoundError,
    LearningEventNotFoundError,
    UnauthorizedAccessError,
    BusinessRuleViolationError,
    SearchIndexError,
    ConcurrencyError,
    InvalidOperationError
)


class TestDomainException:
    """Test cases for base DomainException."""
    
    def test_domain_exception_creation(self):
        """Test creating a domain exception with message and details."""
        details = {"field": "value", "code": 123}
        exception = DomainException("Test error message", details)
        
        assert str(exception) == "Test error message"
        assert exception.message == "Test error message"
        assert exception.details == details
    
    def test_domain_exception_without_details(self):
        """Test creating a domain exception without details."""
        exception = DomainException("Test error message")
        
        assert str(exception) == "Test error message"
        assert exception.message == "Test error message"
        assert exception.details == {}
    
    def test_domain_exception_inheritance(self):
        """Test that DomainException inherits from Exception."""
        exception = DomainException("Test error")
        assert isinstance(exception, Exception)


class TestValidationError:
    """Test cases for ValidationError."""
    
    def test_validation_error_creation(self):
        """Test creating a validation error with field and value."""
        error = ValidationError("email", "invalid-email", "Invalid email format")
        
        assert "Validation failed for field 'email': Invalid email format" in str(error)
        assert error.field == "email"
        assert error.value == "invalid-email"
        assert error.details["field"] == "email"
        assert error.details["value"] == "invalid-email"
    
    def test_validation_error_inheritance(self):
        """Test that ValidationError inherits from DomainException."""
        error = ValidationError("field", "value", "message")
        assert isinstance(error, DomainException)


class TestEntityNotFoundError:
    """Test cases for EntityNotFoundError."""
    
    def test_entity_not_found_error_creation(self):
        """Test creating an entity not found error."""
        entity_id = uuid4()
        error = EntityNotFoundError("User", entity_id)
        
        expected_message = f"User with identifier '{entity_id}' not found"
        assert str(error) == expected_message
        assert error.entity_type == "User"
        assert error.identifier == entity_id
        assert error.details["entity_type"] == "User"
        assert error.details["identifier"] == str(entity_id)
    
    def test_entity_not_found_error_with_custom_message(self):
        """Test creating an entity not found error with custom message."""
        entity_id = uuid4()
        custom_message = "Custom not found message"
        error = EntityNotFoundError("User", entity_id, custom_message)
        
        assert str(error) == custom_message
        assert error.entity_type == "User"
        assert error.identifier == entity_id
    
    def test_entity_not_found_error_inheritance(self):
        """Test that EntityNotFoundError inherits from DomainException."""
        error = EntityNotFoundError("User", uuid4())
        assert isinstance(error, DomainException)


class TestUserNotFoundError:
    """Test cases for UserNotFoundError."""
    
    def test_user_not_found_error_creation(self):
        """Test creating a user not found error."""
        user_id = uuid4()
        error = UserNotFoundError(user_id)
        
        expected_message = f"User with ID '{user_id}' not found"
        assert str(error) == expected_message
        assert error.entity_type == "User"
        assert error.identifier == user_id
    
    def test_user_not_found_error_inheritance(self):
        """Test that UserNotFoundError inherits from EntityNotFoundError."""
        error = UserNotFoundError(uuid4())
        assert isinstance(error, EntityNotFoundError)
        assert isinstance(error, DomainException)


class TestUserEmailAlreadyExistsError:
    """Test cases for UserEmailAlreadyExistsError."""
    
    def test_user_email_already_exists_error_creation(self):
        """Test creating a user email already exists error."""
        email = "test@example.com"
        error = UserEmailAlreadyExistsError(email)
        
        expected_message = f"User with email '{email}' already exists"
        assert str(error) == expected_message
        assert error.email == email
        assert error.details["email"] == email
    
    def test_user_email_already_exists_error_inheritance(self):
        """Test that UserEmailAlreadyExistsError inherits from DomainException."""
        error = UserEmailAlreadyExistsError("test@example.com")
        assert isinstance(error, DomainException)


class TestStudyBookNotFoundError:
    """Test cases for StudyBookNotFoundError."""
    
    def test_study_book_not_found_error_creation(self):
        """Test creating a study book not found error."""
        study_book_id = uuid4()
        error = StudyBookNotFoundError(study_book_id)
        
        expected_message = f"Study book with ID '{study_book_id}' not found"
        assert str(error) == expected_message
        assert error.entity_type == "StudyBook"
        assert error.identifier == study_book_id
    
    def test_study_book_not_found_error_inheritance(self):
        """Test that StudyBookNotFoundError inherits from EntityNotFoundError."""
        error = StudyBookNotFoundError(uuid4())
        assert isinstance(error, EntityNotFoundError)
        assert isinstance(error, DomainException)


class TestQuestionNotFoundError:
    """Test cases for QuestionNotFoundError."""
    
    def test_question_not_found_error_creation(self):
        """Test creating a question not found error."""
        question_id = uuid4()
        error = QuestionNotFoundError(question_id)
        
        expected_message = f"Question with ID '{question_id}' not found"
        assert str(error) == expected_message
        assert error.entity_type == "Question"
        assert error.identifier == question_id
    
    def test_question_not_found_error_inheritance(self):
        """Test that QuestionNotFoundError inherits from EntityNotFoundError."""
        error = QuestionNotFoundError(uuid4())
        assert isinstance(error, EntityNotFoundError)
        assert isinstance(error, DomainException)


class TestTypingLogNotFoundError:
    """Test cases for TypingLogNotFoundError."""
    
    def test_typing_log_not_found_error_creation(self):
        """Test creating a typing log not found error."""
        typing_log_id = uuid4()
        error = TypingLogNotFoundError(typing_log_id)
        
        expected_message = f"Typing log with ID '{typing_log_id}' not found"
        assert str(error) == expected_message
        assert error.entity_type == "TypingLog"
        assert error.identifier == typing_log_id
    
    def test_typing_log_not_found_error_inheritance(self):
        """Test that TypingLogNotFoundError inherits from EntityNotFoundError."""
        error = TypingLogNotFoundError(uuid4())
        assert isinstance(error, EntityNotFoundError)
        assert isinstance(error, DomainException)


class TestLearningEventNotFoundError:
    """Test cases for LearningEventNotFoundError."""
    
    def test_learning_event_not_found_error_creation(self):
        """Test creating a learning event not found error."""
        event_id = uuid4()
        error = LearningEventNotFoundError(event_id)
        
        expected_message = f"Learning event with ID '{event_id}' not found"
        assert str(error) == expected_message
        assert error.entity_type == "LearningEvent"
        assert error.identifier == event_id
    
    def test_learning_event_not_found_error_inheritance(self):
        """Test that LearningEventNotFoundError inherits from EntityNotFoundError."""
        error = LearningEventNotFoundError(uuid4())
        assert isinstance(error, EntityNotFoundError)
        assert isinstance(error, DomainException)


class TestUnauthorizedAccessError:
    """Test cases for UnauthorizedAccessError."""
    
    def test_unauthorized_access_error_creation(self):
        """Test creating an unauthorized access error."""
        user_id = uuid4()
        resource_id = uuid4()
        error = UnauthorizedAccessError(user_id, "StudyBook", resource_id)
        
        expected_message = f"User '{user_id}' is not authorized to access StudyBook '{resource_id}'"
        assert str(error) == expected_message
        assert error.user_id == user_id
        assert error.resource_type == "StudyBook"
        assert error.resource_id == resource_id
        assert error.details["user_id"] == str(user_id)
        assert error.details["resource_type"] == "StudyBook"
        assert error.details["resource_id"] == str(resource_id)
    
    def test_unauthorized_access_error_inheritance(self):
        """Test that UnauthorizedAccessError inherits from DomainException."""
        error = UnauthorizedAccessError(uuid4(), "Resource", "id")
        assert isinstance(error, DomainException)


class TestBusinessRuleViolationError:
    """Test cases for BusinessRuleViolationError."""
    
    def test_business_rule_violation_error_creation(self):
        """Test creating a business rule violation error."""
        rule_name = "max_study_books_per_user"
        message = "User cannot have more than 10 study books"
        context = {"current_count": 10, "max_allowed": 10}
        
        error = BusinessRuleViolationError(rule_name, message, context)
        
        expected_message = f"Business rule '{rule_name}' violated: {message}"
        assert str(error) == expected_message
        assert error.rule_name == rule_name
        assert error.details["rule_name"] == rule_name
        assert error.details["context"] == context
    
    def test_business_rule_violation_error_without_context(self):
        """Test creating a business rule violation error without context."""
        rule_name = "test_rule"
        message = "Test violation"
        
        error = BusinessRuleViolationError(rule_name, message)
        
        assert error.details["context"] == {}
    
    def test_business_rule_violation_error_inheritance(self):
        """Test that BusinessRuleViolationError inherits from DomainException."""
        error = BusinessRuleViolationError("rule", "message")
        assert isinstance(error, DomainException)


class TestSearchIndexError:
    """Test cases for SearchIndexError."""
    
    def test_search_index_error_creation(self):
        """Test creating a search index error."""
        operation = "rebuild_index"
        message = "FTS5 table creation failed"
        
        error = SearchIndexError(operation, message)
        
        expected_message = f"Search index operation '{operation}' failed: {message}"
        assert str(error) == expected_message
        assert error.operation == operation
        assert error.details["operation"] == operation
    
    def test_search_index_error_inheritance(self):
        """Test that SearchIndexError inherits from DomainException."""
        error = SearchIndexError("operation", "message")
        assert isinstance(error, DomainException)


class TestConcurrencyError:
    """Test cases for ConcurrencyError."""
    
    def test_concurrency_error_creation(self):
        """Test creating a concurrency error."""
        entity_id = uuid4()
        error = ConcurrencyError("User", entity_id)
        
        expected_message = f"Concurrent modification detected for User '{entity_id}'"
        assert str(error) == expected_message
        assert error.entity_type == "User"
        assert error.entity_id == entity_id
        assert error.details["entity_type"] == "User"
        assert error.details["entity_id"] == str(entity_id)
    
    def test_concurrency_error_with_custom_message(self):
        """Test creating a concurrency error with custom message."""
        entity_id = uuid4()
        custom_message = "Custom concurrency error"
        error = ConcurrencyError("User", entity_id, custom_message)
        
        assert str(error) == custom_message
        assert error.entity_type == "User"
        assert error.entity_id == entity_id
    
    def test_concurrency_error_inheritance(self):
        """Test that ConcurrencyError inherits from DomainException."""
        error = ConcurrencyError("User", uuid4())
        assert isinstance(error, DomainException)


class TestInvalidOperationError:
    """Test cases for InvalidOperationError."""
    
    def test_invalid_operation_error_creation(self):
        """Test creating an invalid operation error."""
        operation = "delete_user"
        reason = "User has active study books"
        context = {"study_book_count": 5}
        
        error = InvalidOperationError(operation, reason, context)
        
        expected_message = f"Invalid operation '{operation}': {reason}"
        assert str(error) == expected_message
        assert error.operation == operation
        assert error.reason == reason
        assert error.details["operation"] == operation
        assert error.details["reason"] == reason
        assert error.details["context"] == context
    
    def test_invalid_operation_error_without_context(self):
        """Test creating an invalid operation error without context."""
        operation = "test_operation"
        reason = "Test reason"
        
        error = InvalidOperationError(operation, reason)
        
        assert error.details["context"] == {}
    
    def test_invalid_operation_error_inheritance(self):
        """Test that InvalidOperationError inherits from DomainException."""
        error = InvalidOperationError("operation", "reason")
        assert isinstance(error, DomainException)