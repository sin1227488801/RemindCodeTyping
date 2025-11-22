"""
Health check and monitoring endpoints.

This module provides health check endpoints for monitoring system status,
including database connectivity and search index health verification.
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from app.config import settings
from app.monitoring import performance_monitor, get_request_context
from app.logging_config import get_logger, log_with_context
from domain.dtos import HealthCheckResponse, HealthCheckComponent
from domain.exceptions import SearchIndexError
from infra.database import get_database
from infra.sqlite_search import SQLiteFtsStrategy

router = APIRouter(tags=["health"])
logger = get_logger(__name__)


@router.get("/healthz", response_model=HealthCheckResponse)
@performance_monitor.monitor_async_operation("health_check")
async def health_check(request: Request, database=Depends(get_database)):
    """
    Comprehensive health check endpoint.
    
    Checks the status of critical system components:
    - Database connectivity
    - Search index functionality
    
    Returns:
        HealthCheckResponse with overall status and component details
    """
    context = get_request_context(request)
    
    health_status = {
        "status": "healthy",
        "version": settings.app_version,
        "timestamp": datetime.utcnow(),
        "checks": {}
    }
    
    # Database connectivity check
    try:
        log_with_context(
            logger,
            "debug",
            "Checking database connectivity",
            **context
        )
        
        await database.execute("SELECT 1")
        health_status["checks"]["database"] = HealthCheckComponent(
            status="ok"
        )
        
        log_with_context(
            logger,
            "debug",
            "Database connectivity check passed",
            **context
        )
        
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["database"] = HealthCheckComponent(
            status="error",
            message=str(e)
        )
        
        log_with_context(
            logger,
            "error",
            "Database connectivity check failed",
            error=str(e),
            error_type=type(e).__name__,
            **context
        )
    
    # Search index health check
    try:
        log_with_context(
            logger,
            "debug",
            "Checking search index functionality",
            **context
        )
        
        search_strategy = SQLiteFtsStrategy(settings.database_url)
        # Test search with a dummy user ID - this will verify FTS5 table exists
        dummy_user_id = UUID("00000000-0000-0000-0000-000000000000")
        await search_strategy.search_questions("test", dummy_user_id, limit=1)
        health_status["checks"]["search"] = HealthCheckComponent(
            status="ok"
        )
        
        log_with_context(
            logger,
            "debug",
            "Search index check passed",
            **context
        )
        
    except SearchIndexError as e:
        # Search index issues are degraded, not unhealthy
        if health_status["status"] == "healthy":
            health_status["status"] = "degraded"
        health_status["checks"]["search"] = HealthCheckComponent(
            status="error",
            message=str(e)
        )
        
        log_with_context(
            logger,
            "warning",
            "Search index check failed - service degraded",
            error=str(e),
            **context
        )
        
    except Exception as e:
        if health_status["status"] == "healthy":
            health_status["status"] = "degraded"
        health_status["checks"]["search"] = HealthCheckComponent(
            status="error",
            message=f"Search check failed: {str(e)}"
        )
        
        log_with_context(
            logger,
            "error",
            "Search index check failed with unexpected error",
            error=str(e),
            error_type=type(e).__name__,
            **context
        )
    
    # Log overall health status
    database_check = health_status["checks"].get("database")
    search_check = health_status["checks"].get("search")
    
    log_with_context(
        logger,
        "info" if health_status["status"] == "healthy" else "warning",
        f"Health check completed - status: {health_status['status']}",
        health_status=health_status["status"],
        database_status=database_check.status if database_check else "unknown",
        search_status=search_check.status if search_check else "unknown",
        **context
    )
    
    # Create response model and return with appropriate status code
    response_model = HealthCheckResponse(**health_status)
    status_code = 200 if health_status["status"] == "healthy" else 503
    
    return JSONResponse(
        content=response_model.model_dump(mode='json'),
        status_code=status_code
    )


@router.get("/health/database")
async def database_health_check(database=Depends(get_database)):
    """
    Specific database health check endpoint.
    
    Returns:
        Database connectivity status
    """
    try:
        await database.execute("SELECT 1")
        return {"status": "ok", "timestamp": datetime.utcnow()}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={"status": "error", "message": str(e), "timestamp": datetime.utcnow()}
        )


@router.get("/health/search")
async def search_health_check():
    """
    Specific search index health check endpoint.
    
    Returns:
        Search index functionality status
    """
    try:
        search_strategy = SQLiteFtsStrategy(settings.database_url)
        dummy_user_id = UUID("00000000-0000-0000-0000-000000000000")
        await search_strategy.search_questions("test", dummy_user_id, limit=1)
        return {"status": "ok", "timestamp": datetime.utcnow()}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={"status": "error", "message": str(e), "timestamp": datetime.utcnow()}
        )