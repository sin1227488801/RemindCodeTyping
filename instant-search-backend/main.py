"""FastAPI application entry point."""

from datetime import datetime
from uuid import UUID

from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.logging_config import setup_logging, get_logger
from app.middleware import RequestContextMiddleware, UserContextMiddleware, get_trace_id
from domain.exceptions import (
    DomainException, UserNotFoundError, StudyBookNotFoundError, QuestionNotFoundError,
    ValidationError, UnauthorizedAccessError, SearchIndexError
)

from api.users import router as users_router
from api.health import router as health_router
from api.study_books import router as study_books_router
from api.questions import router as questions_router
from api.search import router as search_router
from api.typing_logs import router as typing_logs_router
from api.learning_events import router as learning_events_router
from api.studybooks_compat import router as studybooks_compat_router
from api.admin import router as admin_router
from api.dependencies import get_current_user_id, get_typing_log_repository

# Initialize structured logging
setup_logging()
logger = get_logger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    docs_url="/docs",
    redoc_url="/redoc",
    description="Instant Search Backend API with Frontend Compatibility Layer",
    openapi_tags=[
        {
            "name": "studybooks-compatibility",
            "description": "Frontend compatibility endpoints for StudyBooks functionality. "
                         "These endpoints provide backward compatibility with existing frontend applications."
        },
        {
            "name": "typing-compatibility", 
            "description": "Frontend compatibility endpoints for typing functionality."
        }
    ]
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add middleware (order matters - first added is outermost)
app.add_middleware(UserContextMiddleware)
app.add_middleware(RequestContextMiddleware)


# Global exception handlers


@app.exception_handler(DomainException)
async def domain_exception_handler(request: Request, exc: DomainException):
    """Handle domain exceptions with appropriate HTTP status codes."""
    trace_id = get_trace_id(request)
    user_id = getattr(request.state, "user_id", None)
    
    # Map domain exceptions to HTTP status codes
    status_code_map = {
        UserNotFoundError: 404,
        StudyBookNotFoundError: 404,
        QuestionNotFoundError: 404,
        UnauthorizedAccessError: 401,
        ValidationError: 400,
        SearchIndexError: 500,
    }
    
    status_code = status_code_map.get(type(exc), 500)
    
    # Log domain exception with structured context
    logger.error(
        "Domain exception occurred",
        extra={
            "trace_id": trace_id,
            "user_id": user_id,
            "exception_type": type(exc).__name__,
            "exception_message": str(exc),
            "status_code": status_code,
            "url": str(request.url),
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=status_code,
        content={
            "error": type(exc).__name__,
            "message": str(exc),
            "trace_id": trace_id,
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors."""
    trace_id = get_trace_id(request)
    user_id = getattr(request.state, "user_id", None)
    
    # Log validation error with structured context
    logger.warning(
        "Request validation failed",
        extra={
            "trace_id": trace_id,
            "user_id": user_id,
            "validation_errors": exc.errors(),
            "url": str(request.url),
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=422,
        content={
            "error": "ValidationError",
            "message": "Request validation failed",
            "details": exc.errors(),
            "trace_id": trace_id,
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    trace_id = get_trace_id(request)
    user_id = getattr(request.state, "user_id", None)
    
    # Log unexpected exception with full context
    logger.error(
        "Unexpected exception occurred",
        extra={
            "trace_id": trace_id,
            "user_id": user_id,
            "exception_type": type(exc).__name__,
            "exception_message": str(exc),
            "url": str(request.url),
            "method": request.method
        },
        exc_info=True  # Include stack trace
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred",
            "trace_id": trace_id,
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }
    )

# Include routers
app.include_router(health_router)
app.include_router(admin_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(study_books_router, prefix="/api/v1")
app.include_router(questions_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(typing_logs_router, prefix="/api/v1")
app.include_router(learning_events_router, prefix="/api/v1")
# Include compatibility routers conditionally
if settings.enable_compatibility_endpoints:
    app.include_router(studybooks_compat_router, prefix="/api/v1")
    
    # Add typing compatibility routes
    from fastapi import APIRouter
    typing_router = APIRouter(prefix="/typing", tags=["typing-compatibility"])

    @typing_router.get("/stats")
    async def get_typing_stats_compat(
        user_id: UUID = Depends(get_current_user_id),
        typing_log_repo = Depends(get_typing_log_repository)
    ):
        """Compatibility endpoint for frontend typing stats."""
        from api.typing_logs import get_typing_stats
        return await get_typing_stats(user_id, typing_log_repo)

    app.include_router(typing_router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup."""
    logger.info(
        "Application startup initiated",
        extra={
            "app_name": settings.app_name,
            "app_version": settings.app_version,
            "debug_mode": settings.debug,
            "database_url": settings.database_url.split("://")[0] + "://***"  # Hide sensitive info
        }
    )
    
    try:
        from infra.database import get_database_config
        db_config = get_database_config()
        await db_config.connect()
        
        logger.info(
            "Database connection established",
            extra={
                "database_type": "sqlite"
            }
        )
    except Exception as e:
        logger.error(
            "Failed to establish database connection",
            extra={
                "error": str(e),
                "error_type": type(e).__name__
            },
            exc_info=True
        )
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown."""
    logger.info("Application shutdown initiated")
    
    try:
        from infra.database import get_database_config
        db_config = get_database_config()
        await db_config.disconnect()
        
        logger.info("Database connection closed successfully")
    except Exception as e:
        logger.error(
            "Error during database connection cleanup",
            extra={
                "error": str(e),
                "error_type": type(e).__name__
            },
            exc_info=True
        )


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )