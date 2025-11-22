"""
Domain layer for the instant search backend.

This package contains the core domain models, value objects, DTOs,
and business logic that are independent of infrastructure concerns.
"""

from .models import User, StudyBook, Question, TypingLog, LearningEvent
from .system_problems import SystemProblem, SystemProblemResponse, DifficultyLevel
from .dtos import (
    UserCreateRequest, UserResponse,
    StudyBookCreateRequest, StudyBookUpdateRequest, StudyBookResponse,
    QuestionCreateRequest, QuestionUpdateRequest, QuestionResponse, RandomQuestionResponse,
    TypingLogCreateRequest, TypingLogResponse,
    LearningEventCreateRequest, LearningEventResponse,
    SearchResult, SearchResponse,
    PaginationParams, PaginatedResponse, PaginatedLearningEventsResponse, PaginatedTypingLogsResponse,
    HealthCheckComponent, HealthCheckResponse
)
from .value_objects import (
    Email, Difficulty, TypingPerformance, SearchQuery
)
from .repositories import (
    UserRepository, StudyBookRepository, QuestionRepository,
    TypingLogRepository, LearningEventRepository
)
from .search import SearchStrategy
from .exceptions import (
    DomainException, ValidationError, EntityNotFoundError,
    UserNotFoundError, UserEmailAlreadyExistsError,
    StudyBookNotFoundError, QuestionNotFoundError,
    TypingLogNotFoundError, LearningEventNotFoundError,
    UnauthorizedAccessError, BusinessRuleViolationError,
    SearchIndexError, ConcurrencyError, InvalidOperationError
)
from .error_models import (
    ErrorResponse, ValidationErrorResponse, ProblemDetail,
    get_http_status_code, create_error_response, create_problem_detail,
    COMMON_ERROR_RESPONSES
)

__all__ = [
    # Domain models
    'User', 'StudyBook', 'Question', 'TypingLog', 'LearningEvent',
    'SystemProblem', 'SystemProblemResponse', 'DifficultyLevel',
    
    # DTOs
    'UserCreateRequest', 'UserResponse',
    'StudyBookCreateRequest', 'StudyBookUpdateRequest', 'StudyBookResponse',
    'QuestionCreateRequest', 'QuestionUpdateRequest', 'QuestionResponse', 'RandomQuestionResponse',
    'TypingLogCreateRequest', 'TypingLogResponse',
    'LearningEventCreateRequest', 'LearningEventResponse',
    'SearchResult', 'SearchResponse',
    'PaginationParams', 'PaginatedResponse', 'PaginatedLearningEventsResponse', 'PaginatedTypingLogsResponse',
    'HealthCheckComponent', 'HealthCheckResponse',
    
    # Value objects
    'Email', 'Difficulty', 'TypingPerformance', 'SearchQuery',
    
    # Repository interfaces
    'UserRepository', 'StudyBookRepository', 'QuestionRepository',
    'TypingLogRepository', 'LearningEventRepository',
    
    # Search interfaces
    'SearchStrategy',
    
    # Exceptions
    'DomainException', 'ValidationError', 'EntityNotFoundError',
    'UserNotFoundError', 'UserEmailAlreadyExistsError',
    'StudyBookNotFoundError', 'QuestionNotFoundError',
    'TypingLogNotFoundError', 'LearningEventNotFoundError',
    'UnauthorizedAccessError', 'BusinessRuleViolationError',
    'SearchIndexError', 'ConcurrencyError', 'InvalidOperationError',
    
    # Error models
    'ErrorResponse', 'ValidationErrorResponse', 'ProblemDetail',
    'get_http_status_code', 'create_error_response', 'create_problem_detail',
    'COMMON_ERROR_RESPONSES'
]