"""
Cached system problems service implementation.

This module provides a high-performance cached implementation of the SystemProblemsService
that meets strict performance requirements:
- Language list retrieval: <100ms
- System problems retrieval: <500ms
"""

from typing import List, Dict, Optional
from functools import lru_cache
import time
import asyncio
from app.system_problems_service import SystemProblemsService, create_default_problems_data
from domain.system_problems import SystemProblem


class CachedSystemProblemsService(SystemProblemsService):
    """Cached implementation for optimal performance using LRU cache.
    
    Performance targets:
    - Language list retrieval: <100ms
    - System problems retrieval: <500ms
    """

    def __init__(self, cache_size: int = 128):
        """Initialize cached service with performance optimizations."""
        self._cache_size = cache_size
        self._problems_cache: Optional[Dict[str, List[SystemProblem]]] = None
        self._languages_cache: Optional[List[str]] = None
        self._cache_timestamp: Optional[float] = None
        self._cache_lock = asyncio.Lock()

    async def get_problems_by_language(self, language: str) -> List[SystemProblem]:
        """Get problems for specific language with caching."""
        await self._ensure_cache_loaded()
        normalized_lang = self.normalize_language(language)
        return self._get_problems_by_language_cached(normalized_lang)

    async def get_available_languages(self) -> List[str]:
        """Get list of available languages with caching."""
        await self._ensure_cache_loaded()
        return self._get_available_languages_cached()

    async def _ensure_cache_loaded(self):
        """Ensure cache is loaded with thread safety."""
        if self._problems_cache is None or self._languages_cache is None:
            async with self._cache_lock:
                if self._problems_cache is None or self._languages_cache is None:
                    await self._load_cache_async()

    @lru_cache(maxsize=128)
    def _get_problems_by_language_cached(self, normalized_language: str) -> List[SystemProblem]:
        """LRU cached implementation of get_problems_by_language."""
        return self._problems_cache.get(normalized_language, [])

    @lru_cache(maxsize=1)
    def _get_available_languages_cached(self) -> List[str]:
        """LRU cached implementation of get_available_languages."""
        return self._languages_cache.copy()

    async def _load_cache_async(self):
        """Load both problems and languages cache asynchronously."""
        self._problems_cache = create_default_problems_data()
        self._languages_cache = list(self._problems_cache.keys())
        self._cache_timestamp = time.time()

    def get_cache_info(self) -> Dict[str, any]:
        """Get cache statistics for monitoring and performance analysis."""
        info = {
            "cache_size": self._cache_size,
            "problems_cached": len(self._problems_cache) if self._problems_cache else 0,
            "languages_cached": len(self._languages_cache) if self._languages_cache else 0,
            "cache_timestamp": self._cache_timestamp,
            "cache_age_seconds": time.time() - self._cache_timestamp if self._cache_timestamp else None,
        }
        
        # Add LRU cache statistics
        try:
            info["lru_problems_cache"] = self._get_problems_by_language_cached.cache_info()._asdict()
            info["lru_languages_cache"] = self._get_available_languages_cached.cache_info()._asdict()
        except AttributeError:
            info["lru_problems_cache"] = {"hits": 0, "misses": 0, "maxsize": self._cache_size, "currsize": 0}
            info["lru_languages_cache"] = {"hits": 0, "misses": 0, "maxsize": 1, "currsize": 0}
            
        return info

    async def clear_cache(self):
        """Clear all caches for testing or cache invalidation."""
        async with self._cache_lock:
            self._problems_cache = None
            self._languages_cache = None
            self._cache_timestamp = None
            self._get_problems_by_language_cached.cache_clear()
            self._get_available_languages_cached.cache_clear()

    async def warm_cache(self):
        """Pre-warm the cache for optimal performance."""
        await self._ensure_cache_loaded()
        
        # Pre-populate LRU cache with common languages
        common_languages = ["javascript", "html", "css", "python3", "sql"]
        for lang in common_languages:
            if lang in self._problems_cache:
                self._get_problems_by_language_cached(lang)
        
        # Pre-populate languages cache
        self._get_available_languages_cached()