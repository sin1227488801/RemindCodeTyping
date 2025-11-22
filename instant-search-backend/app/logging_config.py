"""Structured JSON logging configuration."""

import logging
import logging.config
from datetime import datetime
from typing import Dict, Any, Optional
from pythonjsonlogger import jsonlogger

from app.config import settings


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter that ensures required fields are present."""
    
    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        """Add required fields to log record."""
        super().add_fields(log_record, record, message_dict)
        
        # Ensure timestamp is in ISO format
        if not log_record.get('timestamp'):
            log_record['timestamp'] = datetime.utcnow().isoformat() + 'Z'
        
        # Add required fields with defaults
        log_record['app_id'] = getattr(record, 'app_id', 'instant-search-backend')
        log_record['version'] = getattr(record, 'version', settings.app_version)
        log_record['trace_id'] = getattr(record, 'trace_id', 'unknown')
        log_record['user_id'] = getattr(record, 'user_id', None)
        log_record['module'] = record.name
        
        # Move extra fields to 'extra' object if they exist
        extra_fields = {}
        reserved_fields = {
            'timestamp', 'level', 'message', 'trace_id', 'user_id', 
            'app_id', 'version', 'module', 'name', 'levelname', 
            'levelno', 'pathname', 'filename', 'lineno', 'funcName',
            'created', 'msecs', 'relativeCreated', 'thread', 'threadName',
            'processName', 'process', 'getMessage', 'exc_info', 'exc_text',
            'stack_info', 'args', 'msg'
        }
        
        for key, value in log_record.copy().items():
            if key not in reserved_fields:
                extra_fields[key] = value
                del log_record[key]
        
        if extra_fields:
            log_record['extra'] = extra_fields


def setup_logging() -> None:
    """Configure structured JSON logging for the application."""
    
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "()": CustomJsonFormatter,
                "format": "%(timestamp)s %(levelname)s %(message)s"
            },
            "simple": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            }
        },
        "handlers": {
            "json_handler": {
                "class": "logging.StreamHandler",
                "formatter": "json"
            },
            "simple_handler": {
                "class": "logging.StreamHandler",
                "formatter": "simple"
            }
        },
        "loggers": {
            # Application modules use JSON format
            "app": {"level": settings.log_level, "handlers": ["json_handler"], "propagate": False},
            "api": {"level": settings.log_level, "handlers": ["json_handler"], "propagate": False},
            "domain": {"level": settings.log_level, "handlers": ["json_handler"], "propagate": False},
            "infra": {"level": settings.log_level, "handlers": ["json_handler"], "propagate": False},
            # Third-party libraries use simple format
            "uvicorn": {"level": "INFO", "handlers": ["simple_handler"], "propagate": False},
            "uvicorn.access": {"level": "WARNING", "handlers": ["simple_handler"], "propagate": False},
            "sqlalchemy": {"level": "WARNING", "handlers": ["simple_handler"], "propagate": False}
        },
        "root": {
            "level": settings.log_level,
            "handlers": ["json_handler"]
        }
    }
    
    logging.config.dictConfig(logging_config)


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name."""
    return logging.getLogger(name)


def log_with_context(
    logger: logging.Logger,
    level: str,
    message: str,
    trace_id: str = "unknown",
    user_id: Optional[str] = None,
    **extra_fields: Any
) -> None:
    """Log a message with structured context."""
    log_method = getattr(logger, level.lower())
    log_method(
        message,
        extra={
            "trace_id": trace_id,
            "user_id": user_id,
            **extra_fields
        }
    )