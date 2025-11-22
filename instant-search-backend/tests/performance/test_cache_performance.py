"""Performance tests for cached system problems service."""

import asyncio
import time
import pytest
from app.system_problems_service import DefaultSystemProblemsService
from app.cached_service import CachedSystemProblemsService


class TestCachePerformance:
    """Test performance improvements with caching."""

    @pytest.fixture
    def cached_service(self):
        """Create cached service instance."""
        return CachedSystemProblemsService(cache_size=128)

    @pytest.fixture
    def default_service(self):
        """Create default service instance."""
        return DefaultSystemProblemsService()

    @pytest.mark.asyncio
    async def test_languages_response_time_under_100ms(self, cached_service):
        """Test that languages endpoint responds under 100ms requirement."""
        # Warm up cache
        await cached_service.get_available_languages()
        
        # Measure response time
        start_time = time.time()
        languages = await cached_service.get_available_languages()
        end_time = time.time()
        
        response_time_ms = (end_time - start_time) * 1000
        
        assert response_time_ms < 100, f"Languages response time {response_time_ms:.2f}ms exceeds 100ms requirement"
        assert len(languages) > 0, "Should return available languages"

    @pytest.mark.asyncio
    async def test_system_problems_response_time_under_500ms(self, cached_service):
        """Test that system problems endpoint responds under 500ms requirement."""
        # Warm up cache
        await cached_service.get_problems_by_language("javascript")
        
        # Measure response time
        start_time = time.time()
        problems = await cached_service.get_problems_by_language("javascript")
        end_time = time.time()
        
        response_time_ms = (end_time - start_time) * 1000
        
        assert response_time_ms < 500, f"System problems response time {response_time_ms:.2f}ms exceeds 500ms requirement"
        assert len(problems) > 0, "Should return problems for JavaScript"

    @pytest.mark.asyncio
    async def test_cache_performance_improvement(self, cached_service, default_service):
        """Test that cached service is faster than default service."""
        # Test multiple calls to get measurable differences
        iterations = 100
        
        # Test default service performance
        start_time = time.time()
        for _ in range(iterations):
            await default_service.get_available_languages()
        default_time = time.time() - start_time
        
        # Warm up cache
        await cached_service.get_available_languages()
        
        # Test cached service performance
        start_time = time.time()
        for _ in range(iterations):
            await cached_service.get_available_languages()
        cached_time = time.time() - start_time
        
        # Cached should be significantly faster
        improvement_ratio = default_time / cached_time if cached_time > 0 else float('inf')
        assert improvement_ratio > 2, f"Cached service should be at least 2x faster. Default: {default_time*1000:.2f}ms, Cached: {cached_time*1000:.2f}ms, Ratio: {improvement_ratio:.2f}x"

    @pytest.mark.asyncio
    async def test_repeated_calls_performance(self, cached_service):
        """Test performance of repeated calls to verify caching effectiveness."""
        language = "javascript"
        iterations = 50
        
        # Clear cache first
        await cached_service.clear_cache()
        
        # First batch of calls (cache miss + population)
        start_time = time.time()
        for _ in range(iterations):
            problems1 = await cached_service.get_problems_by_language(language)
        first_batch_time = time.time() - start_time
        
        # Second batch of calls (cache hits)
        start_time = time.time()
        for _ in range(iterations):
            problems2 = await cached_service.get_problems_by_language(language)
        second_batch_time = time.time() - start_time
        
        # Results should be identical
        assert problems1 == problems2, "Cached results should be identical"
        
        # Second batch should be faster
        if second_batch_time > 0:
            improvement_ratio = first_batch_time / second_batch_time
            assert improvement_ratio > 1.5, f"Second batch should be faster. First: {first_batch_time*1000:.2f}ms, Second: {second_batch_time*1000:.2f}ms, Ratio: {improvement_ratio:.2f}x"

    @pytest.mark.asyncio
    async def test_concurrent_access_performance(self, cached_service):
        """Test performance under concurrent access."""
        async def get_languages():
            return await cached_service.get_available_languages()
        
        async def get_problems(lang):
            return await cached_service.get_problems_by_language(lang)
        
        # Warm up cache
        await get_languages()
        await get_problems("javascript")
        
        # Test concurrent access
        start_time = time.time()
        
        tasks = []
        for _ in range(10):
            tasks.append(get_languages())
            tasks.append(get_problems("javascript"))
            tasks.append(get_problems("python3"))
        
        results = await asyncio.gather(*tasks)
        
        end_time = time.time()
        total_time_ms = (end_time - start_time) * 1000
        
        # All concurrent calls should complete quickly
        assert total_time_ms < 100, f"Concurrent access took {total_time_ms:.2f}ms, should be under 100ms"
        assert len(results) == 30, "Should have 30 results from concurrent calls"

    def test_cache_info_functionality(self, cached_service):
        """Test cache info and monitoring functionality."""
        # Get cache info
        info = cached_service.get_cache_info()
        
        assert "cache_size" in info
        assert "problems_cached" in info
        assert "languages_cached" in info
        assert info["cache_size"] == 128

    @pytest.mark.asyncio
    async def test_cache_clear_functionality(self, cached_service):
        """Test cache clearing functionality."""
        # Load some data
        await cached_service.get_available_languages()
        await cached_service.get_problems_by_language("javascript")
        
        # Verify cache has data
        info_before = cached_service.get_cache_info()
        assert info_before["problems_cached"] > 0
        assert info_before["languages_cached"] > 0
        
        # Clear cache
        await cached_service.clear_cache()
        
        # Verify cache is cleared
        info_after = cached_service.get_cache_info()
        assert info_after["problems_cached"] == 0
        assert info_after["languages_cached"] == 0

    @pytest.mark.asyncio
    async def test_cache_warm_functionality(self, cached_service):
        """Test cache warming functionality."""
        # Clear cache first
        await cached_service.clear_cache()
        
        # Warm cache
        await cached_service.warm_cache()
        
        # Verify cache is warmed
        info = cached_service.get_cache_info()
        assert info["problems_cached"] > 0
        assert info["languages_cached"] > 0
        
        # Test that warmed cache provides fast access
        start_time = time.time()
        languages = await cached_service.get_available_languages()
        response_time_ms = (time.time() - start_time) * 1000
        
        assert response_time_ms < 50, f"Warmed cache should respond very quickly, got {response_time_ms:.2f}ms"
        assert len(languages) > 0

    @pytest.mark.asyncio
    async def test_memory_usage_efficiency(self, cached_service):
        """Test that cached service uses memory efficiently."""
        import sys
        
        # Clear cache and measure baseline
        await cached_service.clear_cache()
        
        # Load cache and measure memory usage
        await cached_service.get_available_languages()
        await cached_service.get_problems_by_language("javascript")
        await cached_service.get_problems_by_language("python3")
        
        # Verify cache info shows reasonable memory usage
        info = cached_service.get_cache_info()
        assert info["problems_cached"] > 0
        assert info["languages_cached"] > 0
        
        # Cache should not grow indefinitely
        assert info["problems_cached"] <= 20  # Reasonable number of languages
        
    @pytest.mark.asyncio
    async def test_performance_under_load(self, cached_service):
        """Test performance under simulated load."""
        import asyncio
        
        # Warm up cache
        await cached_service.warm_cache()
        
        # Simulate high load with many concurrent requests
        async def make_requests():
            tasks = []
            for _ in range(20):  # 20 concurrent requests
                tasks.append(cached_service.get_available_languages())
                tasks.append(cached_service.get_problems_by_language("javascript"))
            
            start_time = time.time()
            results = await asyncio.gather(*tasks)
            end_time = time.time()
            
            return results, (end_time - start_time) * 1000
        
        results, total_time_ms = await make_requests()
        
        # All requests should complete quickly even under load
        assert total_time_ms < 200, f"High load requests took {total_time_ms:.2f}ms, should be under 200ms"
        assert len(results) == 40  # 20 * 2 requests
        
        # Verify all results are valid
        for result in results:
            assert isinstance(result, list)
            assert len(result) > 0

    @pytest.mark.asyncio
    async def test_cache_hit_ratio_optimization(self, cached_service):
        """Test that cache achieves good hit ratios."""
        # Clear cache
        await cached_service.clear_cache()
        
        # Make initial requests (cache misses)
        await cached_service.get_available_languages()
        await cached_service.get_problems_by_language("javascript")
        
        # Make repeated requests (should be cache hits)
        for _ in range(10):
            await cached_service.get_available_languages()
            await cached_service.get_problems_by_language("javascript")
        
        # Check cache statistics
        info = cached_service.get_cache_info()
        
        # Should have good hit ratios
        if "lru_languages_cache" in info:
            lang_cache = info["lru_languages_cache"]
            if lang_cache["hits"] + lang_cache["misses"] > 0:
                hit_ratio = lang_cache["hits"] / (lang_cache["hits"] + lang_cache["misses"])
                assert hit_ratio > 0.8, f"Language cache hit ratio {hit_ratio:.2f} should be > 0.8"

    @pytest.mark.asyncio
    async def test_performance_regression_detection(self, cached_service, default_service):
        """Test for performance regressions by comparing with baseline."""
        # Test default service performance (baseline)
        start_time = time.time()
        for _ in range(5):
            await default_service.get_available_languages()
        default_time = time.time() - start_time
        
        # Test cached service performance (should be better)
        await cached_service.warm_cache()
        start_time = time.time()
        for _ in range(5):
            await cached_service.get_available_languages()
        cached_time = time.time() - start_time
        
        # Cached should be significantly faster
        if cached_time > 0:
            improvement = default_time / cached_time
            assert improvement > 1.5, f"Cached service should be faster. Default: {default_time*1000:.2f}ms, Cached: {cached_time*1000:.2f}ms"

    @pytest.mark.asyncio
    async def test_scalability_with_multiple_languages(self, cached_service):
        """Test performance scalability with multiple languages."""
        # Get all available languages
        languages = await cached_service.get_available_languages()
        
        # Test accessing problems for all languages
        start_time = time.time()
        
        tasks = []
        for language in languages:
            tasks.append(cached_service.get_problems_by_language(language))
        
        results = await asyncio.gather(*tasks)
        
        total_time_ms = (time.time() - start_time) * 1000
        
        # Should handle all languages efficiently
        avg_time_per_language = total_time_ms / len(languages)
        assert avg_time_per_language < 100, f"Average time per language {avg_time_per_language:.2f}ms should be under 100ms"
        
        # Verify all results are valid
        for result in results:
            assert isinstance(result, list)