"""
Error response models and HTTP status code mappings.

This module defines the structure of error responses and maps domain exceptions
to appropriate HTTP status codes for API responses.
"""

from datetime import datetime
from typing import Dict, Any, Optional, Type
from uuid import UUID

from pydantic import BaseModel

from .exceptions import (
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


class ErrorDetail(BaseModel):
    """Detailed error information."""
    
    field: Optional[str] = None
    message: str
    code: Optional[str] = None


class ErrorResponse(BaseModel):
    """
    Standard error response model for API endpoints.
    
    This provides a consistent structure for all error responses
    across the application.
    """
    
    error: str  # Exception type name
    message: str  # Human-readable error message
    details: Dict[str, Any] = {}  # Additional error context
    trace_id: Optional[str] = None  # Request trace ID for debugging
    timestamp: datetime = datetime.utcnow()
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat() + 'Z',
            UUID: str
        }


class ValidationErrorResponse(ErrorResponse):
    """Specialized error response for validation errors."""
    
    errors: list[ErrorDetail] = []


class ProblemDetail(BaseModel):
    """
    RFC 7807 Problem Details for HTTP APIs.
    
    This provides a standardized way to carry machine-readable details
    of errors in HTTP response bodies.
    """
    
    type: str  # URI reference that identifies the problem type
    title: str  # Short, human-readable summary
    status: int  # HTTP status code
    detail: Optional[str] = None  # Human-readable explanation
    instance: Optional[str] = None  # URI reference that identifies the specific occurrence
    
    # Extension members
    trace_id: Optional[str] = None
    timestamp: datetime = datetime.utcnow()
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat() + 'Z'
        }


# HTTP status code mappings for domain exceptions
ERROR_STATUS_CODE_MAP: Dict[Type[DomainException], int] = {
    # 400 Bad Request - Client errors
    ValidationError: 400,
    BusinessRuleViolationError: 400,
    InvalidOperationError: 400,
    
    # 401 Unauthorized - Authentication required
    # (No domain exceptions map to 401 as auth is handled at infrastructure level)
    
    # 403 Forbidden - Access denied
    UnauthorizedAccessError: 403,
    
    # 404 Not Found - Resource not found
    EntityNotFoundError: 404,
    UserNotFoundError: 404,
    StudyBookNotFoundError: 404,
    QuestionNotFoundError: 404,
    TypingLogNotFoundError: 404,
    LearningEventNotFoundError: 404,
    
    # 409 Conflict - Resource conflict
    UserEmailAlreadyExistsError: 409,
    ConcurrencyError: 409,
    
    # 500 Internal Server Error - Server errors
    SearchIndexError: 500,
    DomainException: 500,  # Fallback for unspecified domain exceptions
}


def get_http_status_code(exception: DomainException) -> int:
    """
    Get the appropriate HTTP status code for a domain exception.
    
    Args:
        exception: Domain exception instance
        
    Returns:
        HTTP status code
    """
    exception_type = type(exception)
    
    # Try exact match first
    if exception_type in ERROR_STATUS_CODE_MAP:
        return ERROR_STATUS_CODE_MAP[exception_type]
    
    # Try parent classes
    for exc_type, status_code in ERROR_STATUS_CODE_MAP.items():
        if isinstance(exception, exc_type):
            return status_code
    
    # Default fallback
    return 500


def create_error_response(
    exception: DomainException,
    trace_id: Optional[str] = None
) -> ErrorResponse:
    """
    Create a standardized error response from a domain exception.
    
    Args:
        exception: Domain exception instance
        trace_id: Optional request trace ID
        
    Returns:
        Error response model
    """
    return ErrorResponse(
        error=type(exception).__name__,
        message=exception.message,
        details=exception.details,
        trace_id=trace_id,
        timestamp=datetime.utcnow()
    )


def create_problem_detail(
    exception: DomainException,
    trace_id: Optional[str] = None,
    instance: Optional[str] = None
) -> ProblemDetail:
    """
    Create an RFC 7807 Problem Detail from a domain exception.
    
    Args:
        exception: Domain exception instance
        trace_id: Optional request trace ID
        instance: Optional URI reference to the specific occurrence
        
    Returns:
        Problem detail model
    """
    exception_type = type(exception).__name__
    status_code = get_http_status_code(exception)
    
    return ProblemDetail(
        type=f"https://api.example.com/problems/{exception_type}",
        title=exception_type.replace('Error', '').replace('Exception', ''),
        status=status_code,
        detail=exception.message,
        instance=instance,
        trace_id=trace_id,
        timestamp=datetime.utcnow()
    )


# Common error response templates
COMMON_ERROR_RESPONSES = {
    400: {
        "description": "Bad Request",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "error": "ValidationError",
                    "message": "Validation failed for field 'email': Invalid email format",
                    "details": {"field": "email", "value": "invalid-email"},
                    "trace_id": "550e8400-e29b-41d4-a716-446655440000",
                    "timestamp": "2023-01-01T00:00:00Z"
                }
            }
        }
    },
    403: {
        "description": "Forbidden",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "error": "UnauthorizedAccessError",
                    "message": "User is not authorized to access this resource",
                    "details": {"user_id": "123e4567-e89b-12d3-a456-426614174000"},
                    "trace_id": "550e8400-e29b-41d4-a716-446655440000",
                    "timestamp": "2023-01-01T00:00:00Z"
                }
            }
        }
    },
    404: {
        "description": "Not Found",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "error": "UserNotFoundError",
                    "message": "User with ID '123e4567-e89b-12d3-a456-426614174000' not found",
                    "details": {"entity_type": "User", "identifier": "123e4567-e89b-12d3-a456-426614174000"},
                    "trace_id": "550e8400-e29b-41d4-a716-446655440000",
                    "timestamp": "2023-01-01T00:00:00Z"
                }
            }
        }
    },
    409: {
        "description": "Conflict",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "error": "UserEmailAlreadyExistsError",
                    "message": "User with email 'user@example.com' already exists",
                    "details": {"email": "user@example.com"},
                    "trace_id": "550e8400-e29b-41d4-a716-446655440000",
                    "timestamp": "2023-01-01T00:00:00Z"
                }
            }
        }
    },
    500: {
        "description": "Internal Server Error",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "error": "SearchIndexError",
                    "message": "Search index operation 'rebuild' failed: Database connection lost",
                    "details": {"operation": "rebuild"},
                    "trace_id": "550e8400-e29b-41d4-a716-446655440000",
                    "timestamp": "2023-01-01T00:00:00Z"
                }
            }
        }
    }
}