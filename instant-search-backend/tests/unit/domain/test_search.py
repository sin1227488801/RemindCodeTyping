"""
Unit tests for search strategy interface.

Tests search strategy interface contracts using mocks to ensure proper behavior
without depending on infrastructure implementations.
"""

import pytest
from unittest.mock import AsyncMock
from uuid import uuid4
from typing import List

from domain.search import SearchStrategy
from domain.dtos import SearchResult
from domain.exceptions import SearchIndexError, ValidationError


class MockSearchStrategy(SearchStrategy):
    """Mock implementation of SearchStrategy for testing."""
    
    def __init__(self):
        self.search_questions_mock = AsyncMock()
        self.rebuild_index_mock = AsyncMock()
    
    async def search_questions(self, query: str, user_id, limit: int = 50) -> List[SearchResult]:
        result = await self.search_questions_mock(query, user_id, limit)
        return result or []
    
    async def rebuild_index(self) -> None:
        await self.rebuild_index_mock()


class TestSearchStrategyContract:
    """Test cases for SearchStrategy interface contract."""
    
    @pytest.fixture
    def search_strategy(self):
        """Fixture providing a mock search strategy."""
        return MockSearchStrategy()
    
    @pytest.fixture
    def sample_search_results(self):
        """Fixture providing sample search results."""
        return [
            SearchResult(
                question_id=uuid4(),
                question="What is Python?",
                answer="Python is a programming language",
                highlight="<mark>Python</mark> is a programming language",
                score=0.95
            ),
            SearchResult(
                question_id=uuid4(),
                question="How to use Python variables?",
                answer="Variables in Python are created by assignment",
                highlight="Variables in <mark>Python</mark> are created by assignment",
                score=0.85
            )
        ]
    
    @pytest.mark.asyncio
    async def test_search_questions_with_results(self, search_strategy, sample_search_results):
        """Test searching questions that returns results."""
        query = "Python"
        user_id = uuid4()
        limit = 50
        
        search_strategy.search_questions_mock.return_value = sample_search_results
        
        results = await search_strategy.search_questions(query, user_id, limit)
        
        assert results == sample_search_results
        assert len(results) == 2
        assert all(isinstance(result, SearchResult) for result in results)
        search_strategy.search_questions_mock.assert_called_once_with(query, user_id, limit)
    
    @pytest.mark.asyncio
    async def test_search_questions_no_results(self, search_strategy):
        """Test searching questions that returns no results."""
        query = "nonexistent"
        user_id = uuid4()
        limit = 50
        
        search_strategy.search_questions_mock.return_value = []
        
        results = await search_strategy.search_questions(query, user_id, limit)
        
        assert results == []
        search_strategy.search_questions_mock.assert_called_once_with(query, user_id, limit)
    
    @pytest.mark.asyncio
    async def test_search_questions_with_custom_limit(self, search_strategy, sample_search_results):
        """Test searching questions with custom limit."""
        query = "Python"
        user_id = uuid4()
        limit = 10
        
        search_strategy.search_questions_mock.return_value = sample_search_results[:1]
        
        results = await search_strategy.search_questions(query, user_id, limit)
        
        assert len(results) == 1
        search_strategy.search_questions_mock.assert_called_once_with(query, user_id, limit)
    
    @pytest.mark.asyncio
    async def test_search_questions_default_limit(self, search_strategy, sample_search_results):
        """Test searching questions with default limit."""
        query = "Python"
        user_id = uuid4()
        
        search_strategy.search_questions_mock.return_value = sample_search_results
        
        results = await search_strategy.search_questions(query, user_id)
        
        assert results == sample_search_results
        search_strategy.search_questions_mock.assert_called_once_with(query, user_id, 50)
    
    @pytest.mark.asyncio
    async def test_search_questions_raises_search_index_error(self, search_strategy):
        """Test that search questions can raise SearchIndexError."""
        query = "Python"
        user_id = uuid4()
        
        search_strategy.search_questions_mock.side_effect = SearchIndexError(
            "search", "FTS5 table not found"
        )
        
        with pytest.raises(SearchIndexError) as exc_info:
            await search_strategy.search_questions(query, user_id)
        
        assert exc_info.value.operation == "search"
        assert "FTS5 table not found" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_search_questions_raises_validation_error(self, search_strategy):
        """Test that search questions can raise ValidationError."""
        query = ""  # Empty query
        user_id = uuid4()
        
        search_strategy.search_questions_mock.side_effect = ValidationError(
            "query", "", "Query cannot be empty"
        )
        
        with pytest.raises(ValidationError) as exc_info:
            await search_strategy.search_questions(query, user_id)
        
        assert exc_info.value.field == "query"
        assert "Query cannot be empty" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_rebuild_index_success(self, search_strategy):
        """Test rebuilding search index successfully."""
        await search_strategy.rebuild_index()
        
        search_strategy.rebuild_index_mock.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_rebuild_index_raises_search_index_error(self, search_strategy):
        """Test that rebuild index can raise SearchIndexError."""
        search_strategy.rebuild_index_mock.side_effect = SearchIndexError(
            "rebuild_index", "Cannot drop FTS5 table"
        )
        
        with pytest.raises(SearchIndexError) as exc_info:
            await search_strategy.rebuild_index()
        
        assert exc_info.value.operation == "rebuild_index"
        assert "Cannot drop FTS5 table" in str(exc_info.value)


class TestSearchResult:
    """Test cases for SearchResult DTO."""
    
    def test_search_result_creation(self):
        """Test creating a SearchResult with valid data."""
        question_id = uuid4()
        search_result = SearchResult(
            question_id=question_id,
            question="What is Python?",
            answer="Python is a programming language",
            highlight="<mark>Python</mark> is a programming language",
            score=0.95
        )
        
        assert search_result.question_id == question_id
        assert search_result.question == "What is Python?"
        assert search_result.answer == "Python is a programming language"
        assert search_result.highlight == "<mark>Python</mark> is a programming language"
        assert search_result.score == 0.95
    
    def test_search_result_score_validation(self):
        """Test SearchResult score validation."""
        question_id = uuid4()
        
        # Test valid scores
        SearchResult(
            question_id=question_id,
            question="Test",
            answer="Test",
            highlight="Test",
            score=0.0
        )
        
        SearchResult(
            question_id=question_id,
            question="Test",
            answer="Test",
            highlight="Test",
            score=1.0
        )
        
        SearchResult(
            question_id=question_id,
            question="Test",
            answer="Test",
            highlight="Test",
            score=0.5
        )
    
    def test_search_result_serialization(self):
        """Test SearchResult JSON serialization."""
        question_id = uuid4()
        search_result = SearchResult(
            question_id=question_id,
            question="What is Python?",
            answer="Python is a programming language",
            highlight="<mark>Python</mark> is a programming language",
            score=0.95
        )
        
        json_data = search_result.model_dump()
        
        assert json_data["question_id"] == question_id
        assert json_data["question"] == "What is Python?"
        assert json_data["answer"] == "Python is a programming language"
        assert json_data["highlight"] == "<mark>Python</mark> is a programming language"
        assert json_data["score"] == 0.95


class TestSearchStrategyInterfaceCompliance:
    """Test cases to ensure SearchStrategy interface is properly defined."""
    
    def test_search_strategy_is_abstract(self):
        """Test that SearchStrategy cannot be instantiated directly."""
        with pytest.raises(TypeError):
            SearchStrategy()
    
    def test_search_strategy_method_signatures(self):
        """Test that SearchStrategy interface has expected method signatures."""
        expected_methods = ['search_questions', 'rebuild_index']
        
        for method_name in expected_methods:
            assert hasattr(SearchStrategy, method_name)
            assert callable(getattr(SearchStrategy, method_name))
    
    def test_search_strategy_abstract_methods(self):
        """Test that SearchStrategy methods are properly marked as abstract."""
        # Verify that attempting to create a concrete class without implementing
        # abstract methods raises TypeError
        
        class IncompleteSearchStrategy(SearchStrategy):
            pass
        
        with pytest.raises(TypeError):
            IncompleteSearchStrategy()
        
        # Verify that implementing all abstract methods allows instantiation
        class CompleteSearchStrategy(SearchStrategy):
            async def search_questions(self, query: str, user_id, limit: int = 50):
                return []
            
            async def rebuild_index(self) -> None:
                pass
        
        # This should not raise an error
        strategy = CompleteSearchStrategy()
        assert isinstance(strategy, SearchStrategy)


class TestSearchStrategyErrorHandling:
    """Test cases for search strategy error handling patterns."""
    
    @pytest.fixture
    def search_strategy(self):
        """Fixture providing a mock search strategy."""
        return MockSearchStrategy()
    
    @pytest.mark.asyncio
    async def test_search_strategy_handles_multiple_exception_types(self, search_strategy):
        """Test that search strategy can handle different types of exceptions."""
        query = "test"
        user_id = uuid4()
        
        # Test SearchIndexError
        search_strategy.search_questions_mock.side_effect = SearchIndexError(
            "search", "Index corrupted"
        )
        
        with pytest.raises(SearchIndexError):
            await search_strategy.search_questions(query, user_id)
        
        # Reset mock and test ValidationError
        search_strategy.search_questions_mock.reset_mock()
        search_strategy.search_questions_mock.side_effect = ValidationError(
            "query", query, "Invalid query format"
        )
        
        with pytest.raises(ValidationError):
            await search_strategy.search_questions(query, user_id)
    
    @pytest.mark.asyncio
    async def test_search_strategy_method_call_tracking(self, search_strategy):
        """Test that search strategy method calls are properly tracked."""
        query = "Python"
        user_id = uuid4()
        limit = 25
        
        search_strategy.search_questions_mock.return_value = []
        
        await search_strategy.search_questions(query, user_id, limit)
        
        # Verify the mock was called with correct parameters
        search_strategy.search_questions_mock.assert_called_once_with(query, user_id, limit)
        
        # Verify call count
        assert search_strategy.search_questions_mock.call_count == 1
        
        # Test rebuild_index call tracking
        await search_strategy.rebuild_index()
        
        search_strategy.rebuild_index_mock.assert_called_once()
        assert search_strategy.rebuild_index_mock.call_count == 1