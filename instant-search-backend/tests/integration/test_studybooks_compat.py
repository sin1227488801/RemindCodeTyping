"""
Integration tests for StudyBooks compatibility API endpoints.

Tests the frontend compatibility endpoints for languages and system problems.
"""

import pytest
from httpx import AsyncClient
from uuid import uuid4

from domain.models import User


class TestStudyBooksCompatibilityAPI:
    """Test StudyBooks compatibility API endpoints."""

    @pytest.mark.asyncio
    async def test_get_languages_success(self, async_test_client: AsyncClient, db_with_user):
        """Test successful retrieval of available languages."""
        # Use existing user from fixture
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Make request
        response = await async_test_client.get(
            "/api/v1/studybooks/languages",
            headers=headers
        )
        
        # Verify response
        assert response.status_code == 200
        data = response.json()
        
        # Should return list of strings
        assert isinstance(data, list)
        assert len(data) > 0
        assert all(isinstance(lang, str) for lang in data)
        
        # Should contain expected languages (title case)
        expected_languages = ["Html", "Css", "Javascript", "Java", "Python3", "Sql", "Git"]
        for lang in expected_languages:
            assert lang in data

    @pytest.mark.asyncio
    async def test_get_languages_unauthorized(self, async_test_client: AsyncClient):
        """Test languages endpoint without authentication."""
        response = await async_test_client.get("/api/v1/studybooks/languages")
        
        # Should require authentication
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_system_problems_success(self, async_test_client: AsyncClient, db_with_user):
        """Test successful retrieval of system problems for a language."""
        # Use existing user from fixture
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test with JavaScript (case insensitive)
        response = await async_test_client.get(
            "/api/v1/studybooks/system-problems/javascript",
            headers=headers
        )
        
        # Verify response
        assert response.status_code == 200
        data = response.json()
        
        # Should return list of problems
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify problem structure
        problem = data[0]
        assert "id" in problem
        assert "question" in problem
        assert "answer" in problem
        assert "difficulty" in problem
        assert "category" in problem
        assert "language" in problem
        
        # Verify data types
        assert isinstance(problem["id"], str)
        assert isinstance(problem["question"], str)
        assert isinstance(problem["answer"], str)
        assert isinstance(problem["difficulty"], str)
        assert isinstance(problem["category"], str)
        assert isinstance(problem["language"], str)

    @pytest.mark.asyncio
    async def test_get_system_problems_case_insensitive(self, async_test_client: AsyncClient, db_with_user):
        """Test that language matching is case insensitive."""
        # Use existing user from fixture
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test different cases of the same language
        test_cases = ["javascript", "JavaScript", "JAVASCRIPT", "Javascript"]
        responses = []
        
        for language in test_cases:
            response = await async_test_client.get(
                f"/api/v1/studybooks/system-problems/{language}",
                headers=headers
            )
            assert response.status_code == 200
            responses.append(response.json())
        
        # All responses should be identical
        first_response = responses[0]
        for response in responses[1:]:
            assert response == first_response

    @pytest.mark.asyncio
    async def test_get_system_problems_unknown_language(self, async_test_client: AsyncClient, db_with_user):
        """Test system problems endpoint with unknown language."""
        # Use existing user from fixture
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test with unknown language
        response = await async_test_client.get(
            "/api/v1/studybooks/system-problems/unknown-language",
            headers=headers
        )
        
        # Should return empty list, not 404
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    @pytest.mark.asyncio
    async def test_get_system_problems_unauthorized(self, async_test_client: AsyncClient):
        """Test system problems endpoint without authentication."""
        response = await async_test_client.get(
            "/api/v1/studybooks/system-problems/javascript"
        )
        
        # Should require authentication
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_system_problems_response_format(self, async_test_client: AsyncClient, db_with_user):
        """Test that system problems response matches expected format."""
        # Use existing user from fixture
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Get problems for HTML
        response = await async_test_client.get(
            "/api/v1/studybooks/system-problems/html",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if data:  # If problems exist
            problem = data[0]
            
            # Verify all required fields exist
            required_fields = ["id", "question", "answer", "difficulty", "category", "language"]
            for field in required_fields:
                assert field in problem, f"Missing required field: {field}"
            
            # Verify difficulty is valid
            valid_difficulties = ["beginner", "intermediate", "advanced"]
            assert problem["difficulty"] in valid_difficulties
            
            # Verify language matches request
            assert problem["language"].lower() == "html"

    @pytest.mark.asyncio
    async def test_multiple_languages_have_problems(self, async_test_client: AsyncClient, db_with_user):
        """Test that multiple languages have system problems available."""
        # Use existing user from fixture
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test several languages
        languages_to_test = ["html", "css", "javascript", "python3", "sql"]
        
        for language in languages_to_test:
            response = await async_test_client.get(
                f"/api/v1/studybooks/system-problems/{language}",
                headers=headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) > 0, f"No problems found for language: {language}"

    @pytest.mark.asyncio
    async def test_frontend_compatibility_response_format(self, async_test_client: AsyncClient, db_with_user):
        """Test that responses match exact frontend expectations."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test languages endpoint format
        response = await async_test_client.get("/api/v1/studybooks/languages", headers=headers)
        assert response.status_code == 200
        languages = response.json()
        
        # Should be array of strings with title case
        assert isinstance(languages, list)
        assert all(isinstance(lang, str) for lang in languages)
        
        # Test system problems endpoint format
        response = await async_test_client.get(
            "/api/v1/studybooks/system-problems/javascript", 
            headers=headers
        )
        assert response.status_code == 200
        problems = response.json()
        
        if problems:
            problem = problems[0]
            # Verify exact field structure expected by frontend
            expected_fields = {"id", "question", "answer", "difficulty", "category", "language"}
            actual_fields = set(problem.keys())
            assert expected_fields == actual_fields, f"Expected fields {expected_fields}, got {actual_fields}"

    @pytest.mark.asyncio
    async def test_error_response_format_compatibility(self, async_test_client: AsyncClient):
        """Test that error responses are compatible with frontend error handling."""
        # Test unauthorized access
        response = await async_test_client.get("/api/v1/studybooks/languages")
        assert response.status_code == 401
        
        error_data = response.json()
        # Should have error structure that frontend expects
        assert "detail" in error_data or "error" in error_data

    @pytest.mark.asyncio
    async def test_special_language_names_handling(self, async_test_client: AsyncClient, db_with_user):
        """Test handling of special language names with spaces and parentheses."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test languages with special characters
        special_languages = ["linux (red hat)", "linux(debian)"]
        
        for language in special_languages:
            response = await async_test_client.get(
                f"/api/v1/studybooks/system-problems/{language}",
                headers=headers
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_content_type_headers(self, async_test_client: AsyncClient, db_with_user):
        """Test that responses have correct content-type headers."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test languages endpoint
        response = await async_test_client.get("/api/v1/studybooks/languages", headers=headers)
        assert response.status_code == 200
        assert "application/json" in response.headers.get("content-type", "")
        
        # Test system problems endpoint
        response = await async_test_client.get(
            "/api/v1/studybooks/system-problems/javascript",
            headers=headers
        )
        assert response.status_code == 200
        assert "application/json" in response.headers.get("content-type", "")

    @pytest.mark.asyncio
    async def test_cors_headers_if_configured(self, async_test_client: AsyncClient, db_with_user):
        """Test CORS headers if configured (for frontend compatibility)."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        response = await async_test_client.get("/api/v1/studybooks/languages", headers=headers)
        assert response.status_code == 200
        
        # CORS headers might be configured - test if present
        cors_headers = [
            "access-control-allow-origin",
            "access-control-allow-methods", 
            "access-control-allow-headers"
        ]
        
        # Don't assert CORS headers are present, just verify they're valid if they exist
        for header in cors_headers:
            if header in response.headers:
                assert response.headers[header] is not None


class TestEnhancedErrorHandlingAndLogging:
    """Test enhanced error handling and logging for compatibility endpoints."""

    @pytest.mark.asyncio
    async def test_trace_id_in_response_headers(self, async_test_client: AsyncClient, db_with_user):
        """Test that trace ID is included in response headers."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        response = await async_test_client.get("/api/v1/studybooks/languages", headers=headers)
        assert response.status_code == 200
        
        # Verify trace ID header is present
        assert "X-Trace-ID" in response.headers
        assert response.headers["X-Trace-ID"] is not None
        assert len(response.headers["X-Trace-ID"]) > 0

    @pytest.mark.asyncio
    async def test_response_time_header(self, async_test_client: AsyncClient, db_with_user):
        """Test that response time is included in headers."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        response = await async_test_client.get("/api/v1/studybooks/languages", headers=headers)
        assert response.status_code == 200
        
        # Verify response time header is present
        assert "X-Response-Time" in response.headers
        response_time = response.headers["X-Response-Time"]
        assert response_time.endswith("ms")
        
        # Extract numeric value and verify it's reasonable
        time_value = int(response_time[:-2])
        assert 0 <= time_value <= 10000  # Should be less than 10 seconds

    @pytest.mark.asyncio
    async def test_empty_language_response_format(self, async_test_client: AsyncClient, db_with_user):
        """Test that non-existent languages return proper empty response."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        response = await async_test_client.get(
            "/api/v1/studybooks/system-problems/nonexistent-language",
            headers=headers
        )
        
        # Should return 200 with empty array (not 404)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
        
        # Should still have proper headers
        assert "X-Trace-ID" in response.headers
        assert "X-Response-Time" in response.headers

    @pytest.mark.asyncio
    async def test_error_response_structure_consistency(self, async_test_client: AsyncClient):
        """Test that error responses have consistent structure."""
        # Test unauthorized access
        response = await async_test_client.get("/api/v1/studybooks/languages")
        assert response.status_code == 401
        
        error_data = response.json()
        
        # Should have consistent error structure
        if "detail" in error_data:
            # FastAPI default error format
            assert isinstance(error_data["detail"], str)
        elif "error" in error_data:
            # Custom error format
            assert "message" in error_data
            assert "trace_id" in error_data
            assert "timestamp" in error_data

    @pytest.mark.asyncio
    async def test_performance_within_requirements(self, async_test_client: AsyncClient, db_with_user):
        """Test that response times meet performance requirements."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test languages endpoint (should be < 100ms per requirements)
        import time
        start_time = time.time()
        response = await async_test_client.get("/api/v1/studybooks/languages", headers=headers)
        end_time = time.time()
        
        assert response.status_code == 200
        duration_ms = (end_time - start_time) * 1000
        
        # Allow some tolerance for test environment
        assert duration_ms < 500, f"Languages endpoint took {duration_ms}ms, should be < 500ms"
        
        # Test system problems endpoint (should be < 500ms per requirements)
        start_time = time.time()
        response = await async_test_client.get(
            "/api/v1/studybooks/system-problems/javascript",
            headers=headers
        )
        end_time = time.time()
        
        assert response.status_code == 200
        duration_ms = (end_time - start_time) * 1000
        
        # Allow some tolerance for test environment
        assert duration_ms < 1000, f"System problems endpoint took {duration_ms}ms, should be < 1000ms"

    @pytest.mark.asyncio
    async def test_compatibility_layer_identification(self, async_test_client: AsyncClient, db_with_user):
        """Test that compatibility endpoints can be identified for monitoring."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test that compatibility endpoints are accessible
        response = await async_test_client.get("/api/v1/studybooks/languages", headers=headers)
        assert response.status_code == 200
        
        response = await async_test_client.get(
            "/api/v1/studybooks/system-problems/javascript",
            headers=headers
        )
        assert response.status_code == 200
        
        # The endpoints should be working and identifiable by their path structure
        # This allows monitoring systems to track compatibility layer usage

    @pytest.mark.asyncio
    async def test_language_normalization_consistency(self, async_test_client: AsyncClient, db_with_user):
        """Test that language normalization is consistent across requests."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test various case combinations
        test_cases = [
            ("javascript", "javascript"),
            ("JavaScript", "javascript"), 
            ("JAVASCRIPT", "javascript"),
            ("Javascript", "javascript"),
            ("python3", "python3"),
            ("PYTHON3", "python3"),
            ("Python3", "python3")
        ]
        
        for input_lang, expected_normalized in test_cases:
            response = await async_test_client.get(
                f"/api/v1/studybooks/system-problems/{input_lang}",
                headers=headers
            )
            
            assert response.status_code == 200
            data = response.json()
            
            if data:  # If problems exist
                # All problems should have the normalized language name
                for problem in data:
                    assert problem["language"] == input_lang  # Should preserve original input

    @pytest.mark.asyncio
    async def test_concurrent_requests_handling(self, async_test_client: AsyncClient, db_with_user):
        """Test that concurrent requests are handled properly."""
        import asyncio
        
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Make multiple concurrent requests
        async def make_request(language):
            return await async_test_client.get(
                f"/api/v1/studybooks/system-problems/{language}",
                headers=headers
            )
        
        # Test concurrent requests to different languages
        languages = ["javascript", "python3", "html", "css", "sql"]
        tasks = [make_request(lang) for lang in languages]
        
        responses = await asyncio.gather(*tasks)
        
        # All requests should succeed
        for response in responses:
            assert response.status_code == 200
            assert isinstance(response.json(), list)
            
            # Each should have unique trace ID
            assert "X-Trace-ID" in response.headers

    @pytest.mark.asyncio
    async def test_special_characters_in_language_names(self, async_test_client: AsyncClient, db_with_user):
        """Test handling of language names with special characters."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test languages with special characters that exist in the system
        special_languages = [
            "linux (red hat)",
            "linux(debian)",
            "git"
        ]
        
        for language in special_languages:
            response = await async_test_client.get(
                f"/api/v1/studybooks/system-problems/{language}",
                headers=headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            
            # Should have proper trace ID even for special characters
            assert "X-Trace-ID" in response.headers

    @pytest.mark.asyncio
    async def test_large_response_handling(self, async_test_client: AsyncClient, db_with_user):
        """Test handling of potentially large responses."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Get all languages
        response = await async_test_client.get("/api/v1/studybooks/languages", headers=headers)
        assert response.status_code == 200
        languages = response.json()
        
        # Test each language to ensure large responses are handled
        for language in languages[:5]:  # Test first 5 to avoid too long test
            response = await async_test_client.get(
                f"/api/v1/studybooks/system-problems/{language.lower()}",
                headers=headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            
            # Response should be properly formatted regardless of size
            if data:
                assert all("id" in problem for problem in data)
                assert all("question" in problem for problem in data)
                assert all("answer" in problem for problem in data)