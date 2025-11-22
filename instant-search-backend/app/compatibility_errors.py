"""
Compatibility layer error handling and logging.

Simplified error handling and logging for frontend compatibility endpoints.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

from fastapi import Request
from fastapi.responses import JSONResponse

from app.logging_config import get_logger
from app.middleware import get_trace_id
from domain.system_problems import SystemProblemResponse


logger = get_logger(__name__)


class CompatibilityErrorHandler:
    """Handles errors specific to compatibility endpoints."""
    
    @staticmethod
    def handle_language_not_found(language: str) -> List[SystemProblemResponse]:
        """
        Handle language not found by returning empty list.
        
        This follows the frontend expectation of receiving an empty array
        rather than a 404 error for non-existent languages.
        """
        return []
    
    @staticmethod
    def handle_service_error(
        request: Request,
        error: Exception,
        service_name: str,
        operation: str
    ) -> JSONResponse:
        """Handle service errors with frontend-compatible format."""
        trace_id = get_trace_id(request)
        user_id = getattr(request.state, "user_id", None)
        
        # Log the service error
        logger.error(
            f"Compatibility service error in {service_name}",
            extra={
                "trace_id": trace_id,
                "user_id": user_id,
                "service_name": service_name,
                "operation": operation,
                "error": str(error),
                "compatibility_layer": True,
                "url": str(request.url),
                "method": request.method
            },
            exc_info=True
        )
        
        return JSONResponse(
            status_code=500,
            content={
                "error": "ServiceError",
                "message": f"Unable to {operation}",
                "trace_id": trace_id,
                "timestamp": datetime.utcnow().isoformat() + 'Z'
            }
        )


class CompatibilityLogger:
    """Simplified logging for compatibility layer operations."""
    
    @staticmethod
    def log_endpoint_access(
        endpoint: str,
        user_id: UUID,
        trace_id: str,
        request: Request,
        **extra_fields: Any
    ) -> None:
        """Log compatibility endpoint access."""
        logger.info(
            f"Compatibility {endpoint} endpoint accessed",
            extra={
                "endpoint": f"/studybooks/{endpoint}",
                "user_id": str(user_id),
                "trace_id": trace_id,
                "compatibility_layer": True,
                **extra_fields
            }
        )
    
    @staticmethod
    def log_operation_success(
        operation: str,
        user_id: UUID,
        trace_id: str,
        duration_ms: Optional[int] = None,
        **extra_fields: Any
    ) -> None:
        """Log successful compatibility operation."""
        log_data = {
            "user_id": str(user_id),
            "trace_id": trace_id,
            "compatibility_layer": True,
            "operation": operation,
            **extra_fields
        }
        
        if duration_ms is not None:
            log_data["duration_ms"] = duration_ms
            
        logger.info(f"Compatibility operation '{operation}' completed", extra=log_data)
    
    @staticmethod
    def log_language_request(
        language: str,
        user_id: UUID,
        trace_id: str,
        found: bool,
        problems_count: int = 0
    ) -> None:
        """Log language-specific request details."""
        logger.info(
            f"Language request: {language}",
            extra={
                "user_id": str(user_id),
                "trace_id": trace_id,
                "compatibility_layer": True,
                "language": language,
                "language_found": found,
                "problems_count": problems_count
            }
        )