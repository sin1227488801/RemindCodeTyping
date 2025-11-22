"""Performance monitoring and error tracking utilities."""

import time
import functools
from typing import Any, Callable, Dict, Optional
from fastapi import Request

from app.logging_config import get_logger, log_with_context

logger = get_logger(__name__)


def monitor_async_operation(operation_name: str):
    """Decorator to monitor async operations with performance metrics."""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            
            # Try to extract trace_id and user_id from context
            trace_id = "unknown"
            user_id = None
            
            # Check if first argument is a Request object
            if args and hasattr(args[0], 'state'):
                request = args[0]
                trace_id = getattr(request.state, 'trace_id', 'unknown')
                user_id = getattr(request.state, 'user_id', None)
            
            try:
                result = await func(*args, **kwargs)
                duration_ms = int((time.time() - start_time) * 1000)
                
                # Only log slow operations to reduce noise
                if duration_ms > 100:  # Log operations taking more than 100ms
                    log_with_context(
                        logger,
                        "info",
                        f"Operation completed: {operation_name}",
                        trace_id=trace_id,
                        user_id=user_id,
                        operation=operation_name,
                        duration_ms=duration_ms
                    )
                
                return result
                
            except Exception as e:
                duration_ms = int((time.time() - start_time) * 1000)
                
                log_with_context(
                    logger,
                    "error",
                    f"Operation failed: {operation_name}",
                    trace_id=trace_id,
                    user_id=user_id,
                    operation=operation_name,
                    duration_ms=duration_ms,
                    error=str(e),
                    error_type=type(e).__name__
                )
                
                raise
                
        return wrapper
    return decorator


def get_request_context(request: Request) -> Dict[str, Any]:
    """Extract monitoring context from request."""
    return {
        "trace_id": getattr(request.state, "trace_id", "unknown"),
        "user_id": getattr(request.state, "user_id", None),
        "method": request.method,
        "path": request.url.path,
        "client_ip": request.client.host if request.client else None
    }


# Convenience function for the decorator
performance_monitor = type('PerformanceMonitor', (), {
    'monitor_async_operation': staticmethod(monitor_async_operation)
})()