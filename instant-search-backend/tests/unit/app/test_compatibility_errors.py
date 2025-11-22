"""
Tests for compatibility error handling and logging.

This module tests the simplified error handling and logging functionality
for the frontend compatibility endpoints.
"""

import pytest
from unittest.mock import Mock, patch
from uuid import uuid4

from fastapi import Request
from fastapi.responses import JSONResponse

from app.compatibility_errors import CompatibilityErrorHandler, CompatibilityLogger


class TestCompatibilityErrorHandler:
    """Test compatibility error handler."""
    
    def test_handle_language_not_found(self):
        """Test language not found handling."""
        result = CompatibilityErrorHandler.handle_language_not_found("nonexistent")
        
        assert isinstance(result, list)
        assert len(result) == 0
    
    @patch('app.compatibility_errors.logger')
    def test_handle_service_error(self, mock_logger):
        """Test service error handling."""
        # Create mock request
        mock_request = Mock(spec=Request)
        mock_request.state.trace_id = "test-trace-id"
        mock_request.state.user_id = "test-user-id"
        mock_request.url = Mock()
        mock_request.url.__str__ = Mock(return_value="http://test.com/api/v1/studybooks/languages")
        mock_request.method = "GET"
        
        # Create test exception
        test_error = Exception("Database connection failed")
        
        # Call handler
        response = CompatibilityErrorHandler.handle_service_error(
            mock_request,
            test_error,
            "SystemProblemsService",
            "retrieve languages"
        )
        
        # Verify response
        assert isinstance(response, JSONResponse)
        assert response.status_code == 500
        
        # Verify logging was called
        mock_logger.error.assert_called_once()
        call_args = mock_logger.error.call_args
        assert "Compatibility service error in SystemProblemsService" in call_args[0][0]
        assert call_args[1]["exc_info"] is True


class TestCompatibilityLogger:
    """Test compatibility logger."""
    
    @patch('app.compatibility_errors.logger')
    def test_log_endpoint_access(self, mock_logger):
        """Test endpoint access logging."""
        user_id = uuid4()
        trace_id = "test-trace-id"
        
        # Create mock request
        mock_request = Mock(spec=Request)
        
        CompatibilityLogger.log_endpoint_access(
            "languages",
            user_id,
            trace_id,
            mock_request,
            extra_field="extra_value"
        )
        
        # Verify logging was called with correct parameters
        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args
        
        assert "Compatibility languages endpoint accessed" in call_args[0][0]
        extra_data = call_args[1]["extra"]
        assert extra_data["endpoint"] == "/studybooks/languages"
        assert extra_data["user_id"] == str(user_id)
        assert extra_data["trace_id"] == trace_id
        assert extra_data["compatibility_layer"] is True
        assert extra_data["extra_field"] == "extra_value"
    
    @patch('app.compatibility_errors.logger')
    def test_log_operation_success(self, mock_logger):
        """Test successful operation logging."""
        user_id = uuid4()
        trace_id = "test-trace-id"
        
        CompatibilityLogger.log_operation_success(
            "get_languages",
            user_id,
            trace_id,
            languages_count=5
        )
        
        # Verify logging was called
        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args
        
        assert "Compatibility operation 'get_languages' completed" in call_args[0][0]
        extra_data = call_args[1]["extra"]
        assert extra_data["user_id"] == str(user_id)
        assert extra_data["trace_id"] == trace_id
        assert extra_data["compatibility_layer"] is True
        assert extra_data["operation"] == "get_languages"
        assert extra_data["languages_count"] == 5
    
    @patch('app.compatibility_errors.logger')
    def test_log_language_request(self, mock_logger):
        """Test language request logging."""
        user_id = uuid4()
        trace_id = "test-trace-id"
        
        CompatibilityLogger.log_language_request(
            "javascript",
            user_id,
            trace_id,
            found=True,
            problems_count=10
        )
        
        # Verify logging was called
        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args
        
        assert "Language request: javascript" in call_args[0][0]
        extra_data = call_args[1]["extra"]
        assert extra_data["user_id"] == str(user_id)
        assert extra_data["trace_id"] == trace_id
        assert extra_data["compatibility_layer"] is True
        assert extra_data["language"] == "javascript"
        assert extra_data["language_found"] is True
        assert extra_data["problems_count"] == 10


@pytest.mark.asyncio
class TestCompatibilityIntegration:
    """Integration tests for compatibility error handling."""
    
    @patch('app.compatibility_errors.logger')
    async def test_error_handling_flow(self, mock_logger):
        """Test complete error handling flow."""
        # Create mock request
        mock_request = Mock(spec=Request)
        mock_request.state.trace_id = "integration-trace-id"
        mock_request.state.user_id = "integration-user-id"
        mock_request.url = Mock()
        mock_request.url.__str__ = Mock(return_value="http://test.com/api/v1/studybooks/system-problems/python")
        mock_request.method = "GET"
        
        # Simulate service error
        service_error = Exception("Database timeout")
        
        # Handle the error
        response = CompatibilityErrorHandler.handle_service_error(
            mock_request,
            service_error,
            "SystemProblemsService",
            "retrieve system problems"
        )
        
        # Verify response structure
        assert isinstance(response, JSONResponse)
        assert response.status_code == 500
        
        # Verify error was logged
        mock_logger.error.assert_called_once()
        
        # Verify response content
        content = response.body.decode()
        assert "ServiceError" in content
        assert "Unable to retrieve system problems" in content
        assert "integration-trace-id" in content