"""Authentication and request context middleware."""

from uuid import uuid4
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import time

from app.logging_config import get_logger, log_with_context
from app.monitoring import get_request_context

logger = get_logger(__name__)


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Middleware to add request context including trace ID and basic logging.
    
    This middleware:
    1. Generates a unique trace ID for each request
    2. Adds trace ID to response headers
    3. Provides basic request/response logging
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate trace ID for request tracking
        trace_id = str(uuid4())
        request.state.trace_id = trace_id
        
        # Record start time for performance monitoring
        start_time = time.time()
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate request duration
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Add trace ID and performance headers
            response.headers["X-Trace-ID"] = trace_id
            response.headers["X-Response-Time"] = f"{duration_ms}ms"
            
            # Log request completion (only for non-health endpoints to reduce noise)
            if not request.url.path.startswith("/health"):
                log_level = "warning" if response.status_code >= 400 else "info"
                
                # Check if this is a compatibility endpoint
                is_compatibility = request.url.path.startswith("/api/v1/studybooks/")
                
                log_data = {
                    "trace_id": trace_id,
                    "user_id": getattr(request.state, "user_id", None),
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms
                }
                
                # Add compatibility layer flag if applicable
                if is_compatibility:
                    log_data["compatibility_layer"] = True
                    log_data["compatibility_endpoint"] = True
                
                log_with_context(
                    logger,
                    log_level,
                    "Request processed",
                    **log_data
                )
            
            return response
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Check if this is a compatibility endpoint
            is_compatibility = request.url.path.startswith("/api/v1/studybooks/")
            
            log_data = {
                "trace_id": trace_id,
                "user_id": getattr(request.state, "user_id", None),
                "method": request.method,
                "path": request.url.path,
                "error": str(e),
                "error_type": type(e).__name__,
                "duration_ms": duration_ms
            }
            
            # Add compatibility layer flag if applicable
            if is_compatibility:
                log_data["compatibility_layer"] = True
                log_data["compatibility_endpoint"] = True
            
            # Log error with context
            log_with_context(
                logger,
                "error",
                "Request failed",
                **log_data
            )
            raise


def get_trace_id(request: Request) -> str:
    """Get trace ID from request state."""
    return getattr(request.state, "trace_id", "unknown")


class UserContextMiddleware(BaseHTTPMiddleware):
    """Middleware to add user context to requests.
    
    This middleware extracts user information from authentication
    and adds it to the request state for use in logging and monitoring.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Extract user ID from header for context (don't validate here)
        user_id_header = request.headers.get("X-User-Id")
        request.state.user_id = user_id_header
        
        # Process request
        response = await call_next(request)
        
        return response


def get_user_id_from_request(request: Request) -> str:
    """Get user ID from request state for logging purposes."""
    return getattr(request.state, "user_id", "anonymous")


