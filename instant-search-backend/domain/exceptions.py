"""
Domain exceptions for the instant search backend.

This module defines the exception hierarchy for domain-specific errors,
following clean architecture principles to keep domain concerns separate
from infrastructure and presentation layers.
"""

from typing import Optional, Dict, Any
from uuid import UUID


class DomainException(Exception):
    """
    Base exception for all domain-related errors.
    
    This is the root of the domain exception hierarchy and should be
    caught by the application layer to handle domain errors appropriately.
    """
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        """
        Initialize domain exception.
        
        Args:
            message: Human-readable error message
            details: Optional additional error details
        """
        super().__init__(message)
        self.message = message
        self.details = details or {}


class ValidationError(DomainException):
    """
    Exception raised when domain validation rules are violated.
    
    This exception is raised when input data doesn't meet domain requirements,
    such as invalid email formats, out-of-range values, etc.
    """
    
    def __init__(self, field: str, value: Any, message: str):
        """
        Initialize validation error.
        
        Args:
            field: Name of the field that failed validation
            value: The invalid value
            message: Validation error message
        """
        super().__init__(f"Validation failed for field '{field}': {message}")
        self.field = field
        self.value = value
        self.details = {"field": field, "value": str(value)}


class EntityNotFoundError(DomainException):
    """
    Base exception for entity not found errors.
    
    This is raised when attempting to access an entity that doesn't exist
    or is not accessible by the current user.
    """
    
    def __init__(self, entity_type: str, identifier: Any, message: Optional[str] = None):
        """
        Initialize entity not found error.
        
        Args:
            entity_type: Type of entity that was not found
            identifier: The identifier used to search for the entity
            message: Optional custom error message
        """
        default_message = f"{entity_type} with identifier '{identifier}' not found"
        super().__init__(message or default_message)
        self.entity_type = entity_type
        self.identifier = identifier
        self.details = {"entity_type": entity_type, "identifier": str(identifier)}


class UserNotFoundError(EntityNotFoundError):
    """Exception raised when a user is not found."""
    
    def __init__(self, user_id: UUID):
        """
        Initialize user not found error.
        
        Args:
            user_id: The user ID that was not found
        """
        super().__init__("User", user_id, f"User with ID '{user_id}' not found")


class UserEmailAlreadyExistsError(DomainException):
    """Exception raised when attempting to create a user with an existing email."""
    
    def __init__(self, email: str):
        """
        Initialize user email already exists error.
        
        Args:
            email: The email address that already exists
        """
        super().__init__(f"User with email '{email}' already exists")
        self.email = email
        self.details = {"email": email}


class StudyBookNotFoundError(EntityNotFoundError):
    """Exception raised when a study book is not found."""
    
    def __init__(self, study_book_id: UUID):
        """
        Initialize study book not found error.
        
        Args:
            study_book_id: The study book ID that was not found
        """
        super().__init__("StudyBook", study_book_id, f"Study book with ID '{study_book_id}' not found")


class QuestionNotFoundError(EntityNotFoundError):
    """Exception raised when a question is not found."""
    
    def __init__(self, question_id: UUID):
        """
        Initialize question not found error.
        
        Args:
            question_id: The question ID that was not found
        """
        super().__init__("Question", question_id, f"Question with ID '{question_id}' not found")


class TypingLogNotFoundError(EntityNotFoundError):
    """Exception raised when a typing log is not found."""
    
    def __init__(self, typing_log_id: UUID):
        """
        Initialize typing log not found error.
        
        Args:
            typing_log_id: The typing log ID that was not found
        """
        super().__init__("TypingLog", typing_log_id, f"Typing log with ID '{typing_log_id}' not found")


class LearningEventNotFoundError(EntityNotFoundError):
    """Exception raised when a learning event is not found."""
    
    def __init__(self, event_id: UUID):
        """
        Initialize learning event not found error.
        
        Args:
            event_id: The learning event ID that was not found
        """
        super().__init__("LearningEvent", event_id, f"Learning event with ID '{event_id}' not found")


class UnauthorizedAccessError(DomainException):
    """
    Exception raised when a user attempts to access resources they don't own.
    
    This enforces the user scoping requirements throughout the system.
    """
    
    def __init__(self, user_id: UUID, resource_type: str, resource_id: Any):
        """
        Initialize unauthorized access error.
        
        Args:
            user_id: The user attempting access
            resource_type: Type of resource being accessed
            resource_id: Identifier of the resource
        """
        message = f"User '{user_id}' is not authorized to access {resource_type} '{resource_id}'"
        super().__init__(message)
        self.user_id = user_id
        self.resource_type = resource_type
        self.resource_id = resource_id
        self.details = {
            "user_id": str(user_id),
            "resource_type": resource_type,
            "resource_id": str(resource_id)
        }


class BusinessRuleViolationError(DomainException):
    """
    Exception raised when business rules are violated.
    
    This is used for domain-specific business logic violations that go beyond
    simple validation errors.
    """
    
    def __init__(self, rule_name: str, message: str, context: Optional[Dict[str, Any]] = None):
        """
        Initialize business rule violation error.
        
        Args:
            rule_name: Name of the business rule that was violated
            message: Description of the violation
            context: Optional context information
        """
        super().__init__(f"Business rule '{rule_name}' violated: {message}")
        self.rule_name = rule_name
        self.details = {"rule_name": rule_name, "context": context or {}}


class SearchIndexError(DomainException):
    """
    Exception raised when search index operations fail.
    
    This covers errors related to full-text search functionality.
    """
    
    def __init__(self, operation: str, message: str):
        """
        Initialize search index error.
        
        Args:
            operation: The search operation that failed
            message: Error description
        """
        super().__init__(f"Search index operation '{operation}' failed: {message}")
        self.operation = operation
        self.details = {"operation": operation}


class ConcurrencyError(DomainException):
    """
    Exception raised when concurrent modification conflicts occur.
    
    This is used for optimistic locking and other concurrency control scenarios.
    """
    
    def __init__(self, entity_type: str, entity_id: Any, message: Optional[str] = None):
        """
        Initialize concurrency error.
        
        Args:
            entity_type: Type of entity with concurrency conflict
            entity_id: Identifier of the conflicted entity
            message: Optional custom error message
        """
        default_message = f"Concurrent modification detected for {entity_type} '{entity_id}'"
        super().__init__(message or default_message)
        self.entity_type = entity_type
        self.entity_id = entity_id
        self.details = {"entity_type": entity_type, "entity_id": str(entity_id)}


class InvalidOperationError(DomainException):
    """
    Exception raised when an operation is invalid in the current context.
    
    This is used for operations that are syntactically correct but semantically
    invalid given the current state of the domain.
    """
    
    def __init__(self, operation: str, reason: str, context: Optional[Dict[str, Any]] = None):
        """
        Initialize invalid operation error.
        
        Args:
            operation: The invalid operation
            reason: Why the operation is invalid
            context: Optional context information
        """
        super().__init__(f"Invalid operation '{operation}': {reason}")
        self.operation = operation
        self.reason = reason
        self.details = {"operation": operation, "reason": reason, "context": context or {}}