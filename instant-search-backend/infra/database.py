"""
Database configuration and SQLAlchemy models for the instant search backend.

This module provides SQLAlchemy ORM models and database connection management
with proper SQLite configuration including PRAGMA settings.
"""

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import (
    Column, String, Text, Integer, Float, DateTime, ForeignKey,
    Index, event, create_engine
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from databases import Database

Base = declarative_base()


class UserModel(Base):
    """SQLAlchemy model for User entity."""
    
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    created_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat() + 'Z')
    updated_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat() + 'Z')
    
    # Relationships
    study_books = relationship("StudyBookModel", back_populates="user", cascade="all, delete-orphan")
    typing_logs = relationship("TypingLogModel", back_populates="user", cascade="all, delete-orphan")


class StudyBookModel(Base):
    """SQLAlchemy model for StudyBook entity."""
    
    __tablename__ = "study_books"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    created_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat() + 'Z')
    updated_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat() + 'Z')
    
    # Relationships
    user = relationship("UserModel", back_populates="study_books")
    questions = relationship("QuestionModel", back_populates="study_book", cascade="all, delete-orphan")


# Index for user_id lookup
Index('idx_study_books_user_id', StudyBookModel.user_id)


class QuestionModel(Base):
    """SQLAlchemy model for Question entity."""
    
    __tablename__ = "questions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    study_book_id = Column(String, ForeignKey("study_books.id", ondelete="CASCADE"), nullable=False)
    language = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)
    difficulty = Column(String(20), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat() + 'Z')
    updated_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat() + 'Z')
    
    # Relationships
    study_book = relationship("StudyBookModel", back_populates="questions")
    typing_logs = relationship("TypingLogModel", back_populates="question")


# Index for study_book_id lookup
Index('idx_questions_study_book_id', QuestionModel.study_book_id)


class TypingLogModel(Base):
    """SQLAlchemy model for TypingLog entity."""
    
    __tablename__ = "typing_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String, ForeignKey("questions.id", ondelete="SET NULL"), nullable=True)
    wpm = Column(Integer, nullable=False)
    accuracy = Column(Float, nullable=False)
    took_ms = Column(Integer, nullable=False)
    created_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat() + 'Z')
    
    # Relationships
    user = relationship("UserModel", back_populates="typing_logs")
    question = relationship("QuestionModel", back_populates="typing_logs")


# Indexes for typing logs
Index('idx_typing_logs_user_id', TypingLogModel.user_id)
Index('idx_typing_logs_question_id', TypingLogModel.question_id)


class LearningEventModel(Base):
    """SQLAlchemy model for LearningEvent entity."""
    
    __tablename__ = "learning_events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, nullable=False)
    app_id = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    object_id = Column(String(100), nullable=True)
    score = Column(Float, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    occurred_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat() + 'Z')


# Index for learning events lookup
Index('idx_learning_events_user_occurred', LearningEventModel.user_id, LearningEventModel.occurred_at.desc())


# Database configuration
class DatabaseConfig:
    """Database configuration and connection management."""
    
    def __init__(self, database_url: str = "sqlite:///./app.db"):
        self.database_url = database_url
        self.database = Database(database_url)
        
        # Create engine for SQLAlchemy operations
        self.engine = create_engine(
            database_url,
            connect_args={"check_same_thread": False} if "sqlite" in database_url else {}
        )
        
        # Create session factory
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
    
    async def connect(self):
        """Connect to database and apply SQLite PRAGMA settings."""
        await self.database.connect()
        
        # Apply SQLite PRAGMA settings for optimal performance and data integrity
        if "sqlite" in self.database_url:
            await self.database.execute("PRAGMA foreign_keys=ON")
            await self.database.execute("PRAGMA journal_mode=WAL")
            await self.database.execute("PRAGMA synchronous=NORMAL")
            await self.database.execute("PRAGMA cache_size=10000")
            await self.database.execute("PRAGMA temp_store=memory")
    
    async def disconnect(self):
        """Disconnect from database."""
        await self.database.disconnect()
    
    def get_session(self):
        """Get a new database session."""
        return self.SessionLocal()


# Global database instance
_database_config: Optional[DatabaseConfig] = None


def get_database_config() -> DatabaseConfig:
    """Get the global database configuration instance."""
    global _database_config
    if _database_config is None:
        from app.config import settings
        _database_config = DatabaseConfig(settings.database_url)
    return _database_config


def init_database(database_url: Optional[str] = None) -> DatabaseConfig:
    """Initialize the global database configuration."""
    global _database_config
    if database_url is None:
        from app.config import settings
        database_url = settings.database_url
    _database_config = DatabaseConfig(database_url)
    return _database_config


# Dependency injection for FastAPI
def get_database():
    """FastAPI dependency to get database connection."""
    return get_database_config().database


def get_db_session():
    """FastAPI dependency to get database session."""
    config = get_database_config()
    session = config.get_session()
    try:
        yield session
    finally:
        session.close()


# Event listeners for automatic timestamp updates
@event.listens_for(UserModel, 'before_update')
def update_user_timestamp(mapper, connection, target):
    """Update the updated_at timestamp when user is modified."""
    target.updated_at = datetime.utcnow().isoformat() + 'Z'


@event.listens_for(StudyBookModel, 'before_update')
def update_study_book_timestamp(mapper, connection, target):
    """Update the updated_at timestamp when study book is modified."""
    target.updated_at = datetime.utcnow().isoformat() + 'Z'


@event.listens_for(QuestionModel, 'before_update')
def update_question_timestamp(mapper, connection, target):
    """Update the updated_at timestamp when question is modified."""
    target.updated_at = datetime.utcnow().isoformat() + 'Z'