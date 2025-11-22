"""
SQLite FTS5 search strategy implementation.

This module implements the SearchStrategy interface using SQLite's FTS5 
full-text search capabilities for development and testing environments.
"""

import sqlite3
from typing import List
from uuid import UUID

from domain.search import SearchStrategy
from domain.dtos import SearchResult
from domain.exceptions import SearchIndexError, ValidationError


class SQLiteFtsStrategy(SearchStrategy):
    """SQLite FTS5 implementation of the search strategy interface.
    
    This implementation uses SQLite's FTS5 virtual table for full-text search
    with relevance scoring and result highlighting.
    """
    
    def __init__(self, database_url: str):
        """Initialize the SQLite FTS5 search strategy.
        
        Args:
            database_url: SQLite database connection string
        """
        self.database_url = database_url
    
    async def search_questions(
        self, 
        query: str, 
        user_id: UUID, 
        limit: int = 50
    ) -> List[SearchResult]:
        """Search questions using SQLite FTS5.
        
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
        if not query or not query.strip():
            raise ValidationError("Search query cannot be empty")
        
        if limit <= 0 or limit > 100:
            raise ValidationError("Limit must be between 1 and 100")
        
        try:
            with sqlite3.connect(self._get_db_path()) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                fts_query = self._prepare_fts_query(query)
                
                search_sql = """
                SELECT 
                    q.id as question_id,
                    q.question,
                    q.answer,
                    snippet(questions_fts, 1, '<mark>', '</mark>', '...', 32) as highlight,
                    bm25(questions_fts) as score
                FROM questions_fts 
                JOIN questions q ON q.id = questions_fts.question_id
                JOIN study_books sb ON sb.id = q.study_book_id
                WHERE questions_fts MATCH ? 
                AND sb.user_id = ?
                ORDER BY bm25(questions_fts) ASC
                LIMIT ?
                """
                
                cursor.execute(search_sql, (fts_query, str(user_id), limit))
                rows = cursor.fetchall()
                
                return [
                    SearchResult(
                        question_id=UUID(row['question_id']),
                        question=row['question'],
                        answer=row['answer'],
                        highlight=row['highlight'] or row['question'],
                        score=max(0.0, 1.0 / (1.0 + abs(row['score'])))
                    )
                    for row in rows
                ]
                
        except sqlite3.Error as e:
            raise SearchIndexError(f"SQLite search error: {str(e)}")
        except Exception as e:
            raise SearchIndexError(f"Unexpected search error: {str(e)}")
    
    async def rebuild_index(self) -> None:
        """Rebuild the FTS5 search index.
        
        This method rebuilds the questions_fts virtual table from the questions table,
        ensuring all questions are properly indexed for search.
        
        Raises:
            SearchIndexError: If index rebuild fails
        """
        try:
            with sqlite3.connect(self._get_db_path()) as conn:
                cursor = conn.cursor()
                cursor.execute("INSERT INTO questions_fts(questions_fts) VALUES('rebuild')")
                conn.commit()
                
        except sqlite3.Error as e:
            raise SearchIndexError(f"Failed to rebuild search index: {str(e)}")
        except Exception as e:
            raise SearchIndexError(f"Unexpected error rebuilding index: {str(e)}")
    
    def _get_db_path(self) -> str:
        """Extract the database file path from the database URL."""
        return self.database_url.replace('sqlite:///', '')
    
    def _prepare_fts_query(self, query: str) -> str:
        """Prepare and sanitize the FTS5 query string.
        
        Args:
            query: Raw search query from user
            
        Returns:
            Sanitized FTS5 query string
        """
        words = query.strip().split()
        if not words:
            return '""'
        
        # Escape quotes in each word and create OR query for broader results
        escaped_words = []
        for word in words:
            escaped_word = word.replace('"', '""')
            escaped_words.append(f'"{escaped_word}"')
        return ' OR '.join(escaped_words)