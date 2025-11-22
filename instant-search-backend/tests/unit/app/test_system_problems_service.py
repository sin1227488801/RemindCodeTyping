"""
Unit tests for SystemProblemsService implementations.

Tests the business logic and data handling of system problems services.
"""

import pytest
from unittest.mock import AsyncMock, patch
from typing import List

from app.system_problems_service import SystemProblemsService, DefaultSystemProblemsService
from app.cached_service import CachedSystemProblemsService
from domain.system_problems import SystemProblem, DifficultyLevel


class TestDefaultSystemProblemsService:
    """Test cases for DefaultSystemProblemsService."""

    @pytest.fixture
    def service(self) -> DefaultSystemProblemsService:
        """Create service instance for testing."""
        return DefaultSystemProblemsService()

    @pytest.mark.asyncio
    async def test_get_available_languages_returns_expected_languages(self, service):
        """Test that get_available_languages returns expected programming languages."""
        languages = await service.get_available_languages()
        
        assert isinstance(languages, list)
        assert len(languages) > 0
        
        # Verify expected languages are present
        expected_languages = [
            "html", "css", "javascript", "php", "java", 
            "python3", "sql", "linux (red hat)", "linux(debian)", "git"
        ]
        
        for expected_lang in expected_languages:
            assert expected_lang in languages, f"Expected language '{expected_lang}' not found"

    @pytest.mark.asyncio
    async def test_get_problems_by_language_javascript(self, service):
        """Test getting problems for JavaScript language."""
        problems = await service.get_problems_by_language("javascript")
        
        assert isinstance(problems, list)
        assert len(problems) > 0
        
        # Verify problem structure
        problem = problems[0]
        assert isinstance(problem, SystemProblem)
        assert problem.question
        assert problem.answer
        assert self._is_valid_difficulty(problem.difficulty)
        assert problem.category

    def _is_valid_difficulty(self, difficulty):
        """Helper method to validate difficulty values."""
        return (difficulty in ["beginner", "intermediate", "advanced"] or 
                isinstance(difficulty, DifficultyLevel))

    @pytest.mark.asyncio
    async def test_get_problems_by_language_case_insensitive(self, service):
        """Test that language matching is case insensitive."""
        # Test different cases
        test_cases = ["javascript", "JavaScript", "JAVASCRIPT", "Javascript"]
        
        results = []
        for language in test_cases:
            problems = await service.get_problems_by_language(language)
            results.append(problems)
        
        # All results should be identical
        first_result = results[0]
        for result in results[1:]:
            assert result == first_result, "Case insensitive matching should return identical results"

    @pytest.mark.asyncio
    async def test_get_problems_by_language_unknown_language(self, service):
        """Test getting problems for unknown language returns empty list."""
        problems = await service.get_problems_by_language("unknown-language")
        
        assert isinstance(problems, list)
        assert len(problems) == 0

    @pytest.mark.asyncio
    async def test_get_problems_by_language_whitespace_handling(self, service):
        """Test that language names with whitespace are handled correctly."""
        # Test with extra whitespace
        problems1 = await service.get_problems_by_language("  javascript  ")
        problems2 = await service.get_problems_by_language("javascript")
        
        assert problems1 == problems2, "Whitespace should be stripped from language names"

    def test_normalize_language_functionality(self, service):
        """Test the normalize_language method."""
        test_cases = [
            ("JavaScript", "javascript"),
            ("  HTML  ", "html"),
            ("PYTHON3", "python3"),
            ("css", "css"),
        ]
        
        for input_lang, expected in test_cases:
            result = service.normalize_language(input_lang)
            assert result == expected, f"normalize_language('{input_lang}') should return '{expected}'"

    @pytest.mark.asyncio
    async def test_problems_data_lazy_loading(self, service):
        """Test that problems data is loaded lazily."""
        # Initially, problems data should be None
        assert service._problems_data is None
        
        # After first call, it should be loaded
        await service.get_available_languages()
        assert service._problems_data is not None
        
        # Subsequent calls should use cached data
        languages1 = await service.get_available_languages()
        languages2 = await service.get_available_languages()
        assert languages1 == languages2

    @pytest.mark.asyncio
    async def test_all_languages_have_problems(self, service):
        """Test that all available languages have at least one problem."""
        languages = await service.get_available_languages()
        
        for language in languages:
            problems = await service.get_problems_by_language(language)
            assert len(problems) > 0, f"Language '{language}' should have at least one problem"

    @pytest.mark.asyncio
    async def test_problem_data_integrity(self, service):
        """Test that all problems have valid data."""
        languages = await service.get_available_languages()
        
        for language in languages:
            problems = await service.get_problems_by_language(language)
            
            for problem in problems:
                # Verify required fields are not empty
                assert problem.question.strip(), f"Problem question is empty for language '{language}'"
                assert problem.answer.strip(), f"Problem answer is empty for language '{language}'"
                assert problem.category.strip(), f"Problem category is empty for language '{language}'"
                
                # Verify difficulty is valid
                assert self._is_valid_difficulty(problem.difficulty), f"Invalid difficulty for language '{language}': {problem.difficulty}"
                
                # Verify question and answer are strings
                assert isinstance(problem.question, str), f"Question should be string for language '{language}'"
                assert isinstance(problem.answer, str), f"Answer should be string for language '{language}'"


class TestCachedSystemProblemsService:
    """Test cases for CachedSystemProblemsService."""

    @pytest.fixture
    def service(self) -> CachedSystemProblemsService:
        """Create cached service instance for testing."""
        return CachedSystemProblemsService(cache_size=64)

    @pytest.mark.asyncio
    async def test_get_available_languages_with_caching(self, service):
        """Test that get_available_languages works with caching."""
        languages = await service.get_available_languages()
        
        assert isinstance(languages, list)
        assert len(languages) > 0
        
        # Second call should use cache
        languages2 = await service.get_available_languages()
        assert languages == languages2

    @pytest.mark.asyncio
    async def test_get_problems_by_language_with_caching(self, service):
        """Test that get_problems_by_language works with caching."""
        problems = await service.get_problems_by_language("javascript")
        
        assert isinstance(problems, list)
        assert len(problems) > 0
        
        # Second call should use cache
        problems2 = await service.get_problems_by_language("javascript")
        assert problems == problems2

    @pytest.mark.asyncio
    async def test_cache_initialization(self, service):
        """Test cache initialization behavior."""
        # Initially cache should be empty
        assert service._problems_cache is None
        assert service._languages_cache is None
        
        # After first call, cache should be initialized
        await service.get_available_languages()
        assert service._problems_cache is not None
        assert service._languages_cache is not None

    @pytest.mark.asyncio
    async def test_cache_info_functionality(self, service):
        """Test cache info and monitoring."""
        # Get initial cache info
        info = service.get_cache_info()
        assert "cache_size" in info
        assert "problems_cached" in info
        assert "languages_cached" in info
        assert info["cache_size"] == 64
        
        # Load some data
        await service.get_available_languages()
        await service.get_problems_by_language("javascript")
        
        # Check updated cache info
        info_after = service.get_cache_info()
        assert info_after["problems_cached"] > 0
        assert info_after["languages_cached"] > 0

    @pytest.mark.asyncio
    async def test_cache_clear_functionality(self, service):
        """Test cache clearing."""
        # Load some data
        await service.get_available_languages()
        await service.get_problems_by_language("javascript")
        
        # Verify cache has data
        info_before = service.get_cache_info()
        assert info_before["problems_cached"] > 0
        
        # Clear cache
        await service.clear_cache()
        
        # Verify cache is cleared
        info_after = service.get_cache_info()
        assert info_after["problems_cached"] == 0
        assert info_after["languages_cached"] == 0

    @pytest.mark.asyncio
    async def test_cache_warm_functionality(self, service):
        """Test cache warming."""
        # Clear cache first
        await service.clear_cache()
        
        # Warm cache
        await service.warm_cache()
        
        # Verify cache is warmed
        info = service.get_cache_info()
        assert info["problems_cached"] > 0
        assert info["languages_cached"] > 0

    @pytest.mark.asyncio
    async def test_concurrent_cache_access(self, service):
        """Test concurrent access to cached service."""
        import asyncio
        
        # Create multiple concurrent tasks
        tasks = [
            service.get_available_languages(),
            service.get_problems_by_language("javascript"),
            service.get_problems_by_language("python3"),
            service.get_available_languages(),
        ]
        
        # Execute concurrently
        results = await asyncio.gather(*tasks)
        
        # Verify results
        assert len(results) == 4
        assert results[0] == results[3]  # Both language calls should return same result
        assert isinstance(results[1], list)  # JavaScript problems
        assert isinstance(results[2], list)  # Python3 problems

    @pytest.mark.asyncio
    async def test_cache_thread_safety(self, service):
        """Test cache thread safety with concurrent initialization."""
        import asyncio
        
        # Clear cache to test concurrent initialization
        await service.clear_cache()
        
        # Create multiple tasks that will trigger cache initialization
        tasks = [
            service.get_available_languages() for _ in range(5)
        ]
        
        # Execute concurrently
        results = await asyncio.gather(*tasks)
        
        # All results should be identical
        first_result = results[0]
        for result in results[1:]:
            assert result == first_result

    def test_cache_size_configuration(self):
        """Test cache size configuration."""
        service = CachedSystemProblemsService(cache_size=256)
        info = service.get_cache_info()
        assert info["cache_size"] == 256

    @pytest.mark.asyncio
    async def test_inheritance_from_base_service(self, service):
        """Test that cached service properly inherits from base service."""
        assert isinstance(service, SystemProblemsService)
        
        # Test that abstract methods are implemented
        languages = await service.get_available_languages()
        assert isinstance(languages, list)
        
        problems = await service.get_problems_by_language("javascript")
        assert isinstance(problems, list)
        
        # Test normalize_language method
        normalized = service.normalize_language("JavaScript")
        assert normalized == "javascript"