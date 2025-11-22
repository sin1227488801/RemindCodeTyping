"""
Admin dashboard API endpoints.

This module provides administrative endpoints for monitoring and managing
the application, including database statistics, user management, and system health.
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from infra.database import get_db_session
from domain.models import User, StudyBook, Question, TypingLog, LearningEvent


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard_stats(db: Session = Depends(get_db_session)):
    """
    Get comprehensive dashboard statistics.
    
    Returns:
        Dashboard statistics including user counts, activity metrics, and database info
    """
    try:
        # User statistics
        total_users = db.query(func.count(User.id)).scalar()
        active_users_7d = db.query(func.count(User.id)).filter(
            User.updated_at >= datetime.utcnow() - timedelta(days=7)
        ).scalar()
        
        # Study book statistics
        total_study_books = db.query(func.count(StudyBook.id)).scalar()
        total_questions = db.query(func.count(Question.id)).scalar()
        
        # Typing log statistics
        total_typing_logs = db.query(func.count(TypingLog.id)).scalar()
        typing_logs_today = db.query(func.count(TypingLog.id)).filter(
            TypingLog.created_at >= datetime.utcnow().date()
        ).scalar()
        
        # Average WPM
        avg_wpm = db.query(func.avg(TypingLog.wpm)).scalar() or 0
        
        # Learning events
        total_events = db.query(func.count(LearningEvent.id)).scalar()
        events_today = db.query(func.count(LearningEvent.id)).filter(
            LearningEvent.created_at >= datetime.utcnow().date()
        ).scalar()
        
        # Language distribution
        language_stats = db.query(
            Question.language,
            func.count(Question.id).label('count')
        ).group_by(Question.language).all()
        
        return {
            "users": {
                "total": total_users,
                "active_7d": active_users_7d
            },
            "content": {
                "study_books": total_study_books,
                "questions": total_questions,
                "languages": [{"language": lang, "count": count} for lang, count in language_stats]
            },
            "activity": {
                "total_typing_logs": total_typing_logs,
                "typing_logs_today": typing_logs_today,
                "total_events": total_events,
                "events_today": events_today,
                "average_wpm": round(float(avg_wpm), 2)
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve dashboard statistics: {str(e)}"
        )


@router.get("/users", response_model=List[Dict[str, Any]])
async def get_all_users(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db_session)
):
    """
    Get all users with their statistics.
    
    Args:
        limit: Maximum number of users to return
        offset: Number of users to skip
        db: Database session
        
    Returns:
        List of users with their statistics
    """
    try:
        users = db.query(User).offset(offset).limit(limit).all()
        
        result = []
        for user in users:
            # Get user statistics
            typing_count = db.query(func.count(TypingLog.id)).filter(
                TypingLog.user_id == user.id
            ).scalar()
            
            study_book_count = db.query(func.count(StudyBook.id)).filter(
                StudyBook.user_id == user.id
            ).scalar()
            
            avg_wpm = db.query(func.avg(TypingLog.wpm)).filter(
                TypingLog.user_id == user.id
            ).scalar() or 0
            
            result.append({
                "id": str(user.id),
                "login_id": user.login_id,
                "name": user.name,
                "email": user.email,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat(),
                "statistics": {
                    "typing_logs": typing_count,
                    "study_books": study_book_count,
                    "average_wpm": round(float(avg_wpm), 2)
                }
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve users: {str(e)}"
        )


@router.get("/database/info", response_model=Dict[str, Any])
async def get_database_info(db: Session = Depends(get_db_session)):
    """
    Get database information and table statistics.
    
    Returns:
        Database information including table sizes and row counts
    """
    try:
        # Get table row counts
        tables = {
            "users": User,
            "study_books": StudyBook,
            "questions": Question,
            "typing_logs": TypingLog,
            "learning_events": LearningEvent
        }
        
        table_stats = {}
        for table_name, model in tables.items():
            count = db.query(func.count(model.id)).scalar()
            table_stats[table_name] = {
                "row_count": count
            }
        
        # Get database file size (SQLite specific)
        try:
            result = db.execute(text("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"))
            db_size = result.scalar()
            db_size_mb = round(db_size / (1024 * 1024), 2) if db_size else 0
        except:
            db_size_mb = 0
        
        return {
            "database_type": "SQLite",
            "database_size_mb": db_size_mb,
            "tables": table_stats,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve database info: {str(e)}"
        )


@router.get("/recent-activity", response_model=List[Dict[str, Any]])
async def get_recent_activity(
    limit: int = 50,
    db: Session = Depends(get_db_session)
):
    """
    Get recent activity across the application.
    
    Args:
        limit: Maximum number of activities to return
        db: Database session
        
    Returns:
        List of recent activities
    """
    try:
        # Get recent typing logs
        recent_logs = db.query(TypingLog).order_by(
            TypingLog.created_at.desc()
        ).limit(limit).all()
        
        activities = []
        for log in recent_logs:
            user = db.query(User).filter(User.id == log.user_id).first()
            activities.append({
                "type": "typing_log",
                "user_id": str(log.user_id),
                "user_name": user.name if user else "Unknown",
                "wpm": log.wpm,
                "accuracy": round(log.accuracy * 100, 2),
                "created_at": log.created_at.isoformat()
            })
        
        # Sort by timestamp
        activities.sort(key=lambda x: x["created_at"], reverse=True)
        
        return activities[:limit]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve recent activity: {str(e)}"
        )


@router.get("/health-check", response_model=Dict[str, Any])
async def admin_health_check(db: Session = Depends(get_db_session)):
    """
    Comprehensive health check for the application.
    
    Returns:
        Health status of various components
    """
    try:
        # Database connectivity check
        db.execute(text("SELECT 1"))
        db_status = "healthy"
        
        # Check if tables exist
        tables_exist = True
        try:
            db.query(User).first()
            db.query(StudyBook).first()
            db.query(Question).first()
        except:
            tables_exist = False
        
        # Get system info
        total_users = db.query(func.count(User.id)).scalar()
        total_questions = db.query(func.count(Question.id)).scalar()
        
        return {
            "status": "healthy" if db_status == "healthy" and tables_exist else "unhealthy",
            "database": {
                "status": db_status,
                "tables_exist": tables_exist
            },
            "data": {
                "users": total_users,
                "questions": total_questions
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
