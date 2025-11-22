"""
SQLAlchemy repository implementations.

This module provides concrete implementations of the repository interfaces
using SQLAlchemy ORM for database operations with proper user scoping
and transaction management.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import func, and_, desc
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from domain.repositories import (
    UserRepository, StudyBookRepository, QuestionRepository,
    TypingLogRepository, LearningEventRepository
)
from domain.models import User, StudyBook, Question, TypingLog, LearningEvent
from domain.exceptions import (
    UserNotFoundError, StudyBookNotFoundError, QuestionNotFoundError,
    ValidationError
)
from .database import (
    UserModel, StudyBookModel, QuestionModel, 
    TypingLogModel, LearningEventModel
)


class SQLAlchemyUserRepository(UserRepository):
    """SQLAlchemy implementation of UserRepository."""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def create(self, user: User) -> User:
        """Create a new user."""
        try:
            db_user = UserModel(
                id=str(user.id),
                name=user.name,
                email=user.email.lower(),
                created_at=user.created_at.isoformat() + 'Z',
                updated_at=user.updated_at.isoformat() + 'Z'
            )
            
            self.session.add(db_user)
            self.session.commit()
            self.session.refresh(db_user)
            
            return self._to_domain_model(db_user)
            
        except SQLAlchemyError as e:
            self.session.rollback()
            if "UNIQUE constraint failed" in str(e):
                raise ValidationError(f"User with email {user.email} already exists")
            raise ValidationError(f"Failed to create user: {str(e)}")
    
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        try:
            db_user = self.session.query(UserModel).filter(
                UserModel.id == str(user_id)
            ).first()
            
            return self._to_domain_model(db_user) if db_user else None
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to get user: {str(e)}")
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email address."""
        try:
            db_user = self.session.query(UserModel).filter(
                UserModel.email == email.lower()
            ).first()
            
            return self._to_domain_model(db_user) if db_user else None
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to get user by email: {str(e)}")
    
    async def update(self, user: User) -> User:
        """Update an existing user."""
        try:
            db_user = self.session.query(UserModel).filter(
                UserModel.id == str(user.id)
            ).first()
            
            if not db_user:
                raise UserNotFoundError(f"User with ID {user.id} not found")
            
            db_user.name = user.name
            db_user.email = user.email.lower()
            db_user.updated_at = datetime.utcnow().isoformat() + 'Z'
            
            self.session.commit()
            self.session.refresh(db_user)
            
            return self._to_domain_model(db_user)
            
        except SQLAlchemyError as e:
            self.session.rollback()
            if "UNIQUE constraint failed" in str(e):
                raise ValidationError(f"User with email {user.email} already exists")
            raise ValidationError(f"Failed to update user: {str(e)}")
    
    async def delete(self, user_id: UUID) -> bool:
        """Delete a user by ID."""
        try:
            result = self.session.query(UserModel).filter(
                UserModel.id == str(user_id)
            ).delete()
            
            self.session.commit()
            return result > 0
            
        except SQLAlchemyError as e:
            self.session.rollback()
            raise ValidationError(f"Failed to delete user: {str(e)}")
    
    def _to_domain_model(self, db_user: UserModel) -> User:
        """Convert SQLAlchemy model to domain model."""
        return User(
            id=UUID(db_user.id),
            name=db_user.name,
            email=db_user.email,
            created_at=datetime.fromisoformat(db_user.created_at.replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(db_user.updated_at.replace('Z', '+00:00'))
        )


class SQLAlchemyStudyBookRepository(StudyBookRepository):
    """SQLAlchemy implementation of StudyBookRepository."""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def create(self, study_book: StudyBook) -> StudyBook:
        """Create a new study book."""
        try:
            db_study_book = StudyBookModel(
                id=str(study_book.id),
                user_id=str(study_book.user_id),
                title=study_book.title,
                description=study_book.description,
                created_at=study_book.created_at.isoformat() + 'Z',
                updated_at=study_book.updated_at.isoformat() + 'Z'
            )
            
            self.session.add(db_study_book)
            self.session.commit()
            self.session.refresh(db_study_book)
            
            return self._to_domain_model(db_study_book)
            
        except SQLAlchemyError as e:
            self.session.rollback()
            raise ValidationError(f"Failed to create study book: {str(e)}")
    
    async def get_by_id(self, study_book_id: UUID, user_id: UUID) -> Optional[StudyBook]:
        """Get study book by ID, scoped to user."""
        try:
            db_study_book = self.session.query(StudyBookModel).filter(
                and_(
                    StudyBookModel.id == str(study_book_id),
                    StudyBookModel.user_id == str(user_id)
                )
            ).first()
            
            return self._to_domain_model(db_study_book) if db_study_book else None
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to get study book: {str(e)}")
    
    async def get_by_user_id(self, user_id: UUID, limit: Optional[int] = None, offset: Optional[int] = None) -> List[StudyBook]:
        """Get all study books for a user."""
        try:
            query = self.session.query(StudyBookModel).filter(
                StudyBookModel.user_id == str(user_id)
            ).order_by(desc(StudyBookModel.created_at))
            
            if offset:
                query = query.offset(offset)
            if limit:
                query = query.limit(limit)
            
            db_study_books = query.all()
            return [self._to_domain_model(sb) for sb in db_study_books]
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to get study books: {str(e)}")
    
    async def update(self, study_book: StudyBook) -> StudyBook:
        """Update an existing study book."""
        try:
            db_study_book = self.session.query(StudyBookModel).filter(
                and_(
                    StudyBookModel.id == str(study_book.id),
                    StudyBookModel.user_id == str(study_book.user_id)
                )
            ).first()
            
            if not db_study_book:
                raise StudyBookNotFoundError(f"Study book with ID {study_book.id} not found")
            
            db_study_book.title = study_book.title
            db_study_book.description = study_book.description
            db_study_book.updated_at = datetime.utcnow().isoformat() + 'Z'
            
            self.session.commit()
            self.session.refresh(db_study_book)
            
            return self._to_domain_model(db_study_book)
            
        except SQLAlchemyError as e:
            self.session.rollback()
            raise ValidationError(f"Failed to update study book: {str(e)}")
    
    async def delete(self, study_book_id: UUID, user_id: UUID) -> bool:
        """Delete a study book by ID, scoped to user."""
        try:
            result = self.session.query(StudyBookModel).filter(
                and_(
                    StudyBookModel.id == str(study_book_id),
                    StudyBookModel.user_id == str(user_id)
                )
            ).delete()
            
            self.session.commit()
            return result > 0
            
        except SQLAlchemyError as e:
            self.session.rollback()
            raise ValidationError(f"Failed to delete study book: {str(e)}")
    
    async def count_by_user_id(self, user_id: UUID) -> int:
        """Count study books for a user."""
        try:
            return self.session.query(StudyBookModel).filter(
                StudyBookModel.user_id == str(user_id)
            ).count()
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to count study books: {str(e)}")
    
    def _to_domain_model(self, db_study_book: StudyBookModel) -> StudyBook:
        """Convert SQLAlchemy model to domain model."""
        return StudyBook(
            id=UUID(db_study_book.id),
            user_id=UUID(db_study_book.user_id),
            title=db_study_book.title,
            description=db_study_book.description,
            created_at=datetime.fromisoformat(db_study_book.created_at.replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(db_study_book.updated_at.replace('Z', '+00:00'))
        )


class SQLAlchemyQuestionRepository(QuestionRepository):
    """SQLAlchemy implementation of QuestionRepository."""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def create(self, question: Question) -> Question:
        """Create a new question."""
        try:
            db_question = QuestionModel(
                id=str(question.id),
                study_book_id=str(question.study_book_id),
                language=question.language,
                category=question.category,
                difficulty=question.difficulty,
                question=question.question,
                answer=question.answer,
                created_at=question.created_at.isoformat() + 'Z',
                updated_at=question.updated_at.isoformat() + 'Z'
            )
            
            self.session.add(db_question)
            self.session.commit()
            self.session.refresh(db_question)
            
            return self._to_domain_model(db_question)
            
        except SQLAlchemyError as e:
            self.session.rollback()
            raise ValidationError(f"Failed to create question: {str(e)}")
    
    async def get_by_id(self, question_id: UUID, user_id: UUID) -> Optional[Question]:
        """Get question by ID, scoped to user through study book ownership."""
        try:
            db_question = self.session.query(QuestionModel).join(
                StudyBookModel, QuestionModel.study_book_id == StudyBookModel.id
            ).filter(
                and_(
                    QuestionModel.id == str(question_id),
                    StudyBookModel.user_id == str(user_id)
                )
            ).first()
            
            return self._to_domain_model(db_question) if db_question else None
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to get question: {str(e)}")
    
    async def get_by_study_book_id(self, study_book_id: UUID, user_id: UUID, limit: Optional[int] = None, offset: Optional[int] = None) -> List[Question]:
        """Get all questions for a study book, scoped to user."""
        try:
            query = self.session.query(QuestionModel).join(
                StudyBookModel, QuestionModel.study_book_id == StudyBookModel.id
            ).filter(
                and_(
                    QuestionModel.study_book_id == str(study_book_id),
                    StudyBookModel.user_id == str(user_id)
                )
            ).order_by(QuestionModel.created_at)
            
            if offset:
                query = query.offset(offset)
            if limit:
                query = query.limit(limit)
            
            db_questions = query.all()
            return [self._to_domain_model(q) for q in db_questions]
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to get questions: {str(e)}")
    
    async def get_random_by_study_book_id(self, study_book_id: UUID, user_id: UUID) -> Optional[Question]:
        """Get a random question from a study book, scoped to user."""
        try:
            db_question = self.session.query(QuestionModel).join(
                StudyBookModel, QuestionModel.study_book_id == StudyBookModel.id
            ).filter(
                and_(
                    QuestionModel.study_book_id == str(study_book_id),
                    StudyBookModel.user_id == str(user_id)
                )
            ).order_by(func.random()).first()
            
            return self._to_domain_model(db_question) if db_question else None
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to get random question: {str(e)}")
    
    async def update(self, question: Question, user_id: UUID) -> Question:
        """Update an existing question."""
        try:
            db_question = self.session.query(QuestionModel).join(
                StudyBookModel, QuestionModel.study_book_id == StudyBookModel.id
            ).filter(
                and_(
                    QuestionModel.id == str(question.id),
                    StudyBookModel.user_id == str(user_id)
                )
            ).first()
            
            if not db_question:
                raise QuestionNotFoundError(f"Question with ID {question.id} not found")
            
            db_question.language = question.language
            db_question.category = question.category
            db_question.difficulty = question.difficulty
            db_question.question = question.question
            db_question.answer = question.answer
            db_question.updated_at = datetime.utcnow().isoformat() + 'Z'
            
            self.session.commit()
            self.session.refresh(db_question)
            
            return self._to_domain_model(db_question)
            
        except SQLAlchemyError as e:
            self.session.rollback()
            raise ValidationError(f"Failed to update question: {str(e)}")
    
    async def delete(self, question_id: UUID, user_id: UUID) -> bool:
        """Delete a question by ID, scoped to user."""
        try:
            # First verify the question exists and user owns it
            question = self.session.query(QuestionModel).join(
                StudyBookModel, QuestionModel.study_book_id == StudyBookModel.id
            ).filter(
                and_(
                    QuestionModel.id == str(question_id),
                    StudyBookModel.user_id == str(user_id)
                )
            ).first()
            
            if not question:
                return False
            
            # Delete the question
            self.session.delete(question)
            self.session.commit()
            return True
            
        except SQLAlchemyError as e:
            self.session.rollback()
            raise ValidationError(f"Failed to delete question: {str(e)}")
    
    async def count_by_study_book_id(self, study_book_id: UUID, user_id: UUID) -> int:
        """Count questions in a study book, scoped to user."""
        try:
            return self.session.query(QuestionModel).join(
                StudyBookModel, QuestionModel.study_book_id == StudyBookModel.id
            ).filter(
                and_(
                    QuestionModel.study_book_id == str(study_book_id),
                    StudyBookModel.user_id == str(user_id)
                )
            ).count()
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to count questions: {str(e)}")
    
    def _to_domain_model(self, db_question: QuestionModel) -> Question:
        """Convert SQLAlchemy model to domain model."""
        return Question(
            id=UUID(db_question.id),
            study_book_id=UUID(db_question.study_book_id),
            language=db_question.language,
            category=db_question.category,
            difficulty=db_question.difficulty,
            question=db_question.question,
            answer=db_question.answer,
            created_at=datetime.fromisoformat(db_question.created_at.replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(db_question.updated_at.replace('Z', '+00:00'))
        )


class SQLAlchemyTypingLogRepository(TypingLogRepository):
    """SQLAlchemy implementation of TypingLogRepository."""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def create(self, typing_log: TypingLog) -> TypingLog:
        """Create a new typing log entry."""
        try:
            db_typing_log = TypingLogModel(
                id=str(typing_log.id),
                user_id=str(typing_log.user_id),
                question_id=str(typing_log.question_id) if typing_log.question_id else None,
                wpm=typing_log.wpm,
                accuracy=typing_log.accuracy,
                took_ms=typing_log.took_ms,
                created_at=typing_log.created_at.isoformat() + 'Z'
            )
            
            self.session.add(db_typing_log)
            self.session.commit()
            self.session.refresh(db_typing_log)
            
            return self._to_domain_model(db_typing_log)
            
        except SQLAlchemyError as e:
            self.session.rollback()
            raise ValidationError(f"Failed to create typing log: {str(e)}")
    
    async def get_by_id(self, typing_log_id: UUID, user_id: UUID) -> Optional[TypingLog]:
        """Get typing log by ID, scoped to user."""
        try:
            db_typing_log = self.session.query(TypingLogModel).filter(
                and_(
                    TypingLogModel.id == str(typing_log_id),
                    TypingLogModel.user_id == str(user_id)
                )
            ).first()
            
            return self._to_domain_model(db_typing_log) if db_typing_log else None
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to get typing log: {str(e)}")
    
    async def get_by_user_id(self, user_id: UUID, limit: Optional[int] = None, offset: Optional[int] = None) -> List[TypingLog]:
        """Get typing logs for a user, ordered by creation time (newest first)."""
        try:
            query = self.session.query(TypingLogModel).filter(
                TypingLogModel.user_id == str(user_id)
            ).order_by(desc(TypingLogModel.created_at))
            
            if offset:
                query = query.offset(offset)
            if limit:
                query = query.limit(limit)
            
            db_typing_logs = query.all()
            return [self._to_domain_model(tl) for tl in db_typing_logs]
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to get typing logs: {str(e)}")
    
    async def get_by_question_id(self, question_id: UUID, user_id: UUID, limit: Optional[int] = None, offset: Optional[int] = None) -> List[TypingLog]:
        """Get typing logs for a specific question, scoped to user."""
        try:
            query = self.session.query(TypingLogModel).filter(
                and_(
                    TypingLogModel.question_id == str(question_id),
                    TypingLogModel.user_id == str(user_id)
                )
            ).order_by(desc(TypingLogModel.created_at))
            
            if offset:
                query = query.offset(offset)
            if limit:
                query = query.limit(limit)
            
            db_typing_logs = query.all()
            return [self._to_domain_model(tl) for tl in db_typing_logs]
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to get typing logs by question: {str(e)}")
    
    async def count_by_user_id(self, user_id: UUID) -> int:
        """Count typing logs for a user."""
        try:
            return self.session.query(TypingLogModel).filter(
                TypingLogModel.user_id == str(user_id)
            ).count()
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to count typing logs: {str(e)}")
    
    def _to_domain_model(self, db_typing_log: TypingLogModel) -> TypingLog:
        """Convert SQLAlchemy model to domain model."""
        return TypingLog(
            id=UUID(db_typing_log.id),
            user_id=UUID(db_typing_log.user_id),
            question_id=UUID(db_typing_log.question_id) if db_typing_log.question_id else None,
            wpm=db_typing_log.wpm,
            accuracy=db_typing_log.accuracy,
            took_ms=db_typing_log.took_ms,
            created_at=datetime.fromisoformat(db_typing_log.created_at.replace('Z', '+00:00'))
        )


class SQLAlchemyLearningEventRepository(LearningEventRepository):
    """SQLAlchemy implementation of LearningEventRepository."""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def create(self, learning_event: LearningEvent) -> LearningEvent:
        """Create a new learning event."""
        try:
            db_learning_event = LearningEventModel(
                id=str(learning_event.id),
                user_id=learning_event.user_id,
                app_id=learning_event.app_id,
                action=learning_event.action,
                object_id=learning_event.object_id,
                score=learning_event.score,
                duration_ms=learning_event.duration_ms,
                occurred_at=learning_event.occurred_at.isoformat() + 'Z'
            )
            
            self.session.add(db_learning_event)
            self.session.commit()
            self.session.refresh(db_learning_event)
            
            return self._to_domain_model(db_learning_event)
            
        except SQLAlchemyError as e:
            self.session.rollback()
            raise ValidationError(f"Failed to create learning event: {str(e)}")
    
    async def get_by_id(self, event_id: UUID, user_id: str) -> Optional[LearningEvent]:
        """Get learning event by ID, scoped to user."""
        try:
            db_learning_event = self.session.query(LearningEventModel).filter(
                and_(
                    LearningEventModel.id == str(event_id),
                    LearningEventModel.user_id == user_id
                )
            ).first()
            
            return self._to_domain_model(db_learning_event) if db_learning_event else None
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to get learning event: {str(e)}")
    
    async def get_by_user_id(self, user_id: str, limit: Optional[int] = None, offset: Optional[int] = None) -> List[LearningEvent]:
        """Get learning events for a user, ordered by occurrence time (newest first)."""
        try:
            query = self.session.query(LearningEventModel).filter(
                LearningEventModel.user_id == user_id
            ).order_by(desc(LearningEventModel.occurred_at))
            
            if offset:
                query = query.offset(offset)
            if limit:
                query = query.limit(limit)
            
            db_learning_events = query.all()
            return [self._to_domain_model(le) for le in db_learning_events]
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to get learning events: {str(e)}")
    
    async def get_by_action(self, user_id: str, action: str, limit: Optional[int] = None, offset: Optional[int] = None) -> List[LearningEvent]:
        """Get learning events for a user filtered by action type."""
        try:
            query = self.session.query(LearningEventModel).filter(
                and_(
                    LearningEventModel.user_id == user_id,
                    LearningEventModel.action == action
                )
            ).order_by(desc(LearningEventModel.occurred_at))
            
            if offset:
                query = query.offset(offset)
            if limit:
                query = query.limit(limit)
            
            db_learning_events = query.all()
            return [self._to_domain_model(le) for le in db_learning_events]
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to get learning events by action: {str(e)}")
    
    async def count_by_user_id(self, user_id: str) -> int:
        """Count learning events for a user."""
        try:
            return self.session.query(LearningEventModel).filter(
                LearningEventModel.user_id == user_id
            ).count()
            
        except SQLAlchemyError as e:
            raise ValidationError(f"Failed to count learning events: {str(e)}")
    
    def _to_domain_model(self, db_learning_event: LearningEventModel) -> LearningEvent:
        """Convert SQLAlchemy model to domain model."""
        return LearningEvent(
            id=UUID(db_learning_event.id),
            user_id=db_learning_event.user_id,
            app_id=db_learning_event.app_id,
            action=db_learning_event.action,
            object_id=db_learning_event.object_id,
            score=db_learning_event.score,
            duration_ms=db_learning_event.duration_ms,
            occurred_at=datetime.fromisoformat(db_learning_event.occurred_at.replace('Z', '+00:00'))
        )