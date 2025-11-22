"""
Search strategy interfaces for the instant search backend.

This module defines the abstract search strategy interface for implementing 
full-text search functionality with different backends (SQLite FTS5, PostgreSQL, etc.).
"""

from abc import ABC, abstractmethod
from typing import List
from uuid import UUID

from .dtos import SearchResult


class SearchStrategy(ABC):
    """Abstract base class for search strategy implementations.
    
    This interface allows for different search backends (SQLite FTS5, PostgreSQL, etc.)
    while maintaining consistent behavior across the application.
    """
    
    @abstractmethod
    async def search_questions(
        self, 
        query: str, 
        user_id: UUID, 
        limit: int = 50
    ) -> List[SearchResult]:
        """Search questions using full-text search.
        
        Args:
            query: The search query string
            user_id: User ID to scope the search to user's questions only
            limit: Maximum number of results to return (default: 50)
            
        Returns:
            List of SearchResult objects ordered by relevance score
            
        Raises:
            SearchIndexError: If search index is unavailable or corrupted
            ValidationError: If query parameters are invalid
        """
        pass
    
    @abstractmethod
    async def rebuild_index(self) -> None:
        """Rebuild the search index.
        
        This method should rebuild the full-text search index from scratch,
        ensuring all questions are properly indexed for search.
        
        Raises:
            SearchIndexError: If index rebuild fails
        """
        pass