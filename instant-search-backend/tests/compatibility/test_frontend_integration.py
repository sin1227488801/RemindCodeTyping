"""
Frontend compatibility integration tests.

Tests that verify the API endpoints work exactly as expected by the frontend,
including response formats, case sensitivity, and error handling.
"""

import pytest
import asyncio
from httpx import AsyncClient
from typing import List, Dict, Any

from domain.models import User


class TestFrontendCompatibility:
    """Test frontend compatibility requirements."""

    @pytest.mark.asyncio
    async def test_languages_endpoint_exact_format(self, async_test_client: AsyncClient, db_with_user):
        """Test that languages endpoint returns exact format expected by frontend."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        response = await async_test_client.get("/api/v1/studybooks/languages", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Validate response format
        self._validate_languages_response_format(data)
        
        # Verify expected languages are present
        expected_languages = ["Html", "Css", "Javascript", "Java", "Python3", "Sql", "Git"]
        self._validate_expected_languages_present(data, expected_languages)

    def _validate_languages_response_format(self, data):
        """Helper to validate languages response format."""
        assert isinstance(data, list), "Languages response must be an array"
        assert len(data) > 0, "Languages array must not be empty"
        assert all(isinstance(lang, str) for lang in data), "All language entries must be strings"

    def _validate_expected_languages_present(self, data, expected_languages):
        """Helper to validate expected languages are present."""
        for expected_lang in expected_languages:
            assert expected_lang in data, f"Expected language '{expected_lang}' not found in response"

    @pytest.mark.asyncio
    async def test_system_problems_endpoint_exact_format(self, async_test_client: AsyncClient, db_with_user):
        """Test that system problems endpoint returns exact format expected by frontend."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        response = await async_test_client.get(
            "/api/v1/studybooks/system-problems/JavaScript",
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Must be array
        assert isinstance(data, list), "System problems response must be an array"
        assert len(data) > 0, "System problems array must not be empty"
        
        # Check first problem structure
        problem = data[0]
        assert isinstance(problem, dict), "Each problem must be an object"
        
        # Verify exact field structure
        required_fields = {"id", "question", "answer", "difficulty", "category", "language"}
        actual_fields = set(problem.keys())
        assert required_fields == actual_fields, f"Problem object must have exactly these fields: {required_fields}"
        
        # Verify field types
        assert isinstance(problem["id"], str), "Problem id must be string"
        assert isinstance(problem["question"], str), "Problem question must be string"
        assert isinstance(problem["answer"], str), "Problem answer must be string"
        assert isinstance(problem["difficulty"], str), "Problem difficulty must be string"
        assert isinstance(problem["category"], str), "Problem category must be string"
        assert isinstance(problem["language"], str), "Problem language must be string"
        
        # Verify field content
        assert problem["id"].strip(), "Problem id must not be empty"
        assert problem["question"].strip(), "Problem question must not be empty"
        assert problem["answer"].strip(), "Problem answer must not be empty"
        assert problem["difficulty"] in ["beginner", "intermediate", "advanced"], "Invalid difficulty level"
        assert problem["category"].strip(), "Problem category must not be empty"
        assert problem["language"].strip(), "Problem language must not be empty"

    @pytest.mark.asyncio
    async def test_case_insensitive_language_matching_comprehensive(self, async_test_client: AsyncClient, db_with_user):
        """Test comprehensive case insensitive language matching as expected by frontend."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test various case combinations for JavaScript
        test_cases = [
            "javascript",
            "JavaScript", 
            "JAVASCRIPT",
            "Javascript",
            "javaScript",
            "javascripT"
        ]
        
        responses = []
        for language in test_cases:
            response = await async_test_client.get(
                f"/api/v1/studybooks/system-problems/{language}",
                headers=headers
            )
            assert response.status_code == 200, f"Failed for language case: {language}"
            responses.append(response.json())
        
        # All responses must be identical
        first_response = responses[0]
        for i, response in enumerate(responses[1:], 1):
            assert response == first_response, f"Case insensitive matching failed for test case {i}"

    @pytest.mark.asyncio
    async def test_unknown_language_handling_frontend_expectation(self, async_test_client: AsyncClient, db_with_user):
        """Test that unknown languages return empty array, not 404 (frontend expectation)."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        unknown_languages = [
            "unknown-language",
            "nonexistent",
            "fake-lang",
            "xyz123",
            ""  # Empty string
        ]
        
        for language in unknown_languages:
            response = await async_test_client.get(
                f"/api/v1/studybooks/system-problems/{language}",
                headers=headers
            )
            
            # Must return 200, not 404
            assert response.status_code == 200, f"Unknown language '{language}' should return 200, not 404"
            
            data = response.json()
            assert isinstance(data, list), "Unknown language response must be array"
            assert len(data) == 0, "Unknown language response must be empty array"

    @pytest.mark.asyncio
    async def test_authentication_error_format(self, async_test_client: AsyncClient):
        """Test that authentication errors match frontend expectations."""
        # Test without authentication headers
        response = await async_test_client.get("/api/v1/studybooks/languages")
        assert response.status_code == 401
        
        error_data = response.json()
        assert isinstance(error_data, dict), "Error response must be object"
        
        # Should have error information that frontend can handle
        assert "detail" in error_data or "error" in error_data or "message" in error_data
        
        # Test system problems endpoint without auth
        response = await async_test_client.get("/api/v1/studybooks/system-problems/javascript")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_response_time_requirements_frontend(self, async_test_client: AsyncClient, db_with_user):
        """Test response time requirements for frontend performance."""
        import time
        
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test languages endpoint response time (<100ms requirement)
        start_time = time.time()
        response = await async_test_client.get("/api/v1/studybooks/languages", headers=headers)
        languages_time = (time.time() - start_time) * 1000
        
        assert response.status_code == 200
        # Note: In test environment, we allow more lenient timing
        assert languages_time < 1000, f"Languages endpoint took {languages_time:.2f}ms (should be fast)"
        
        # Test system problems endpoint response time (<500ms requirement)
        start_time = time.time()
        response = await async_test_client.get(
            "/api/v1/studybooks/system-problems/javascript",
            headers=headers
        )
        problems_time = (time.time() - start_time) * 1000
        
        assert response.status_code == 200
        # Note: In test environment, we allow more lenient timing
        assert problems_time < 2000, f"System problems endpoint took {problems_time:.2f}ms (should be fast)"

    @pytest.mark.asyncio
    async def test_concurrent_frontend_requests(self, async_test_client: AsyncClient, db_with_user):
        """Test concurrent requests as frontend might make them."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Simulate frontend making multiple concurrent requests
        tasks = [
            async_test_client.get("/api/v1/studybooks/languages", headers=headers),
            async_test_client.get("/api/v1/studybooks/system-problems/javascript", headers=headers),
            async_test_client.get("/api/v1/studybooks/system-problems/html", headers=headers),
            async_test_client.get("/api/v1/studybooks/system-problems/css", headers=headers),
            async_test_client.get("/api/v1/studybooks/languages", headers=headers),  # Duplicate request
        ]
        
        responses = await asyncio.gather(*tasks)
        
        # All requests should succeed
        for i, response in enumerate(responses):
            assert response.status_code == 200, f"Request {i} failed with status {response.status_code}"
        
        # Duplicate language requests should return identical data
        languages_1 = responses[0].json()
        languages_2 = responses[4].json()
        assert languages_1 == languages_2, "Duplicate language requests should return identical data"

    @pytest.mark.asyncio
    async def test_special_characters_in_language_names(self, async_test_client: AsyncClient, db_with_user):
        """Test handling of language names with special characters."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test languages with spaces and special characters
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
            assert response.status_code == 200, f"Failed for special language: {language}"
            
            data = response.json()
            assert isinstance(data, list), f"Response for '{language}' must be array"

    @pytest.mark.asyncio
    async def test_url_encoding_handling(self, async_test_client: AsyncClient, db_with_user):
        """Test URL encoding handling for language names."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test URL encoded language names
        test_cases = [
            ("linux%20(red%20hat)", "linux (red hat)"),
            ("linux(debian)", "linux(debian)"),
            ("javascript", "javascript")
        ]
        
        for encoded_lang, expected_lang in test_cases:
            response = await async_test_client.get(
                f"/api/v1/studybooks/system-problems/{encoded_lang}",
                headers=headers
            )
            assert response.status_code == 200, f"Failed for encoded language: {encoded_lang}"

    @pytest.mark.asyncio
    async def test_http_methods_frontend_compatibility(self, async_test_client: AsyncClient, db_with_user):
        """Test that only GET methods are supported as expected by frontend."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Test that POST, PUT, DELETE are not allowed
        unsupported_methods = [
            ("POST", "/api/v1/studybooks/languages"),
            ("PUT", "/api/v1/studybooks/languages"),
            ("DELETE", "/api/v1/studybooks/languages"),
            ("POST", "/api/v1/studybooks/system-problems/javascript"),
            ("PUT", "/api/v1/studybooks/system-problems/javascript"),
            ("DELETE", "/api/v1/studybooks/system-problems/javascript"),
        ]
        
        for method, url in unsupported_methods:
            response = await async_test_client.request(method, url, headers=headers)
            # Should return 405 Method Not Allowed or 404 Not Found
            assert response.status_code in [404, 405], f"{method} {url} should not be allowed"

    @pytest.mark.asyncio
    async def test_data_consistency_across_requests(self, async_test_client: AsyncClient, db_with_user):
        """Test that data remains consistent across multiple requests."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Make multiple requests for the same data
        num_requests = 5
        
        # Test languages consistency
        language_responses = []
        for _ in range(num_requests):
            response = await async_test_client.get("/api/v1/studybooks/languages", headers=headers)
            assert response.status_code == 200
            language_responses.append(response.json())
        
        # All responses should be identical
        first_languages = language_responses[0]
        for languages in language_responses[1:]:
            assert languages == first_languages, "Language responses should be consistent"
        
        # Test system problems consistency
        problem_responses = []
        for _ in range(num_requests):
            response = await async_test_client.get(
                "/api/v1/studybooks/system-problems/javascript",
                headers=headers
            )
            assert response.status_code == 200
            problem_responses.append(response.json())
        
        # All responses should be identical
        first_problems = problem_responses[0]
        for problems in problem_responses[1:]:
            assert problems == first_problems, "System problems responses should be consistent"

    @pytest.mark.asyncio
    async def test_problem_id_stability(self, async_test_client: AsyncClient, db_with_user):
        """Test that problem IDs are stable across requests (important for frontend caching)."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        # Get problems multiple times
        response1 = await async_test_client.get(
            "/api/v1/studybooks/system-problems/javascript",
            headers=headers
        )
        response2 = await async_test_client.get(
            "/api/v1/studybooks/system-problems/javascript",
            headers=headers
        )
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        problems1 = response1.json()
        problems2 = response2.json()
        
        # Problems should be identical, including IDs
        assert problems1 == problems2, "Problem data including IDs should be stable"
        
        # Verify IDs are present and consistent
        if problems1:
            for i, problem in enumerate(problems1):
                assert problem["id"] == problems2[i]["id"], f"Problem {i} ID should be stable"