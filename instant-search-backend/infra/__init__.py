"""
Infrastructure layer - Database and external service implementations.

This package contains concrete implementations of domain interfaces
for databases, search engines, and external services.
"""

from .sqlite_search import SQLiteFtsStrategy
from .database import (
    Base,
    UserModel,
    StudyBookModel,
    QuestionModel,
    TypingLogModel,
    LearningEventModel,
    DatabaseConfig,
    get_database_config,
    init_database,
    get_database,
    get_db_session,
)
from .repositories import (
    SQLAlchemyUserRepository,
    SQLAlchemyStudyBookRepository,
    SQLAlchemyQuestionRepository,
    SQLAlchemyTypingLogRepository,
    SQLAlchemyLearningEventRepository,
)

__all__ = [
    'SQLiteFtsStrategy',
    "Base",
    "UserModel",
    "StudyBookModel", 
    "QuestionModel",
    "TypingLogModel",
    "LearningEventModel",
    "DatabaseConfig",
    "get_database_config",
    "init_database",
    "get_database",
    "get_db_session",
    "SQLAlchemyUserRepository",
    "SQLAlchemyStudyBookRepository",
    "SQLAlchemyQuestionRepository",
    "SQLAlchemyTypingLogRepository",
    "SQLAlchemyLearningEventRepository",
]