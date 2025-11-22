"""
Repository contract tests.

Tests that repository implementations correctly implement the repository interfaces
using real database connections.
"""

import pytest
import asyncio
from uuid import uuid4
from datetime import datetime

from infra.repositories import (
    SQLAlchemyUserRepository,
    SQLAlchemyStudyBookRepository,
    SQLAlchemyQuestionRepository,
    SQLAlchemyTypingLogRepository,
    SQLAlchemyLearningEventRepository
)
from domain.models import User, StudyBook, Question, TypingLog, LearningEvent
from domain.exceptions import UserNotFoundError, StudyBookNotFoundError


class TestRepositoryBasicFunctionality:
    """Test basic repository functionality to ensure they work with the database."""
    
    def test_repository_instantiation(self, test_db):
        """Test that repositories can be instantiated with a database session."""
        session = test_db.get_session()
        try:
            # Test that all repositories can be created
            user_repo = SQLAlchemyUserRepository(session)
            study_book_repo = SQLAlchemyStudyBookRepository(session)
            question_repo = SQLAlchemyQuestionRepository(session)
            typing_log_repo = SQLAlchemyTypingLogRepository(session)
            learning_event_repo = SQLAlchemyLearningEventRepository(session)
            
            # Verify they are the correct types
            assert isinstance(user_repo, SQLAlchemyUserRepository)
            assert isinstance(study_book_repo, SQLAlchemyStudyBookRepository)
            assert isinstance(question_repo, SQLAlchemyQuestionRepository)
            assert isinstance(typing_log_repo, SQLAlchemyTypingLogRepository)
            assert isinstance(learning_event_repo, SQLAlchemyLearningEventRepository)
            
        finally:
            session.close()
    
    def test_database_tables_exist(self, test_db):
        """Test that database tables are created properly."""
        session = test_db.get_session()
        try:
            # Test that we can query the tables (even if empty)
            from infra.database import UserModel, StudyBookModel, QuestionModel, TypingLogModel, LearningEventModel
            
            # These should not raise exceptions
            user_count = session.query(UserModel).count()
            study_book_count = session.query(StudyBookModel).count()
            question_count = session.query(QuestionModel).count()
            typing_log_count = session.query(TypingLogModel).count()
            learning_event_count = session.query(LearningEventModel).count()
            
            # All should be 0 for a fresh database
            assert user_count == 0
            assert study_book_count == 0
            assert question_count == 0
            assert typing_log_count == 0
            assert learning_event_count == 0
            
        finally:
            session.close()
    
    def test_database_connection_works(self, test_db):
        """Test that the database connection and basic operations work."""
        session = test_db.get_session()
        try:
            # Test basic SQL execution
            result = session.execute("SELECT 1 as test_value").fetchone()
            assert result[0] == 1
            
        finally:
            session.close()


class TestRepositoryInterfaceCompliance:
    """Test that repository implementations comply with their interfaces."""
    
    def test_repositories_implement_interfaces(self):
        """Test that all repository classes implement their respective interfaces."""
        from domain.repositories import (
            UserRepository, StudyBookRepository, QuestionRepository,
            TypingLogRepository, LearningEventRepository
        )
        
        # Test inheritance
        assert issubclass(SQLAlchemyUserRepository, UserRepository)
        assert issubclass(SQLAlchemyStudyBookRepository, StudyBookRepository)
        assert issubclass(SQLAlchemyQuestionRepository, QuestionRepository)
        assert issubclass(SQLAlchemyTypingLogRepository, TypingLogRepository)
        assert issubclass(SQLAlchemyLearningEventRepository, LearningEventRepository)
    
    def test_repository_methods_exist(self):
        """Test that repository implementations have the required methods."""
        # Test UserRepository methods
        user_repo_methods = ['create', 'get_by_id', 'get_by_email', 'update', 'delete']
        for method_name in user_repo_methods:
            assert hasattr(SQLAlchemyUserRepository, method_name)
            assert callable(getattr(SQLAlchemyUserRepository, method_name))
        
        # Test StudyBookRepository methods
        study_book_repo_methods = ['create', 'get_by_id', 'get_by_user_id', 'update', 'delete', 'count_by_user_id']
        for method_name in study_book_repo_methods:
            assert hasattr(SQLAlchemyStudyBookRepository, method_name)
            assert callable(getattr(SQLAlchemyStudyBookRepository, method_name))
        
        # Test QuestionRepository methods
        question_repo_methods = ['create', 'get_by_id', 'get_by_study_book_id', 'get_random_by_study_book_id', 'update', 'delete', 'count_by_study_book_id']
        for method_name in question_repo_methods:
            assert hasattr(SQLAlchemyQuestionRepository, method_name)
            assert callable(getattr(SQLAlchemyQuestionRepository, method_name))