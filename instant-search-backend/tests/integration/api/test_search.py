"""
Integration tests for search functionality.

Tests full-text search with database integration and user scoping.
"""

import pytest
from httpx import AsyncClient
from fastapi import status

from domain.models import User, StudyBook, Question


class TestSearchEndpoints:
    """Test cases for search functionality."""
    
    @pytest.mark.asyncio
    async def test_search_questions_success(self, async_test_client: AsyncClient, db_with_question: Question, sample_user: User):
        """Test searching questions successfully."""
        headers = {"X-User-Id": str(sample_user.id)}
        
        response = await async_test_client.get(
            "/api/v1/search/questions?q=variable",
            headers=headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "query" in data
        assert "results" in data
        assert "total_count" in data
        assert data["query"] == "variable"
        assert isinstance(data["results"], list)
        assert isinstance(data["total_count"], int)
    
    @pytest.mark.asyncio
    async def test_search_questions_with_results(self, async_test_client: AsyncClient, sample_user: User):
        """Test search returns relevant results."""
        headers = {"X-User-Id": str(sample_user.id)}
        
        # First create a user and study book
        await async_test_client.post("/api/v1/users", json={
            "name": sample_user.name,
            "email": sample_user.email
        })
        
        study_book_response = await async_test_client.post(
            "/api/v1/study-books",
            json={"title": "Python Basics"},
            headers=headers
        )
        study_book_id = study_book_response.json()["id"]
        
        # Create questions with searchable content
        questions = [
            {
                "language": "Python",
                "category": "Variables",
                "difficulty": "easy",
                "question": "What is a variable in Python?",
                "answer": "A variable is a storage location with a name."
            },
            {
                "language": "Python",
                "category": "Functions",
                "difficulty": "medium",
                "question": "How do you define a function?",
                "answer": "Use the def keyword followed by function name."
            }
        ]
        
        for question_data in questions:
            await async_test_client.post(
                f"/api/v1/study-books/{study_book_id}/questions",
                json=question_data,
                headers=headers
            )
        
        # Search for "variable"
        response = await async_test_client.get(
            "/api/v1/search/questions?q=variable",
            headers=headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["total_count"] >= 1
        
        # Should find the question about variables
        found_variable_question = False
        for result in data["results"]:
            if "variable" in result["question"].lower() or "variable" in result["answer"].lower():
                found_variable_question = True
                assert "question_id" in result
                assert "question" in result
                assert "answer" in result
                assert "highlight" in result
                assert "score" in result
                break
        
        assert found_variable_question, "Should find question containing 'variable'"
    
    @pytest.mark.asyncio
    async def test_search_questions_no_results(self, async_test_client: AsyncClient, db_with_user: User):
        """Test search with no matching results."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        response = await async_test_client.get(
            "/api/v1/search/questions?q=nonexistentterm",
            headers=headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["query"] == "nonexistentterm"
        assert data["results"] == []
        assert data["total_count"] == 0
    
    @pytest.mark.asyncio
    async def test_search_questions_empty_query(self, async_test_client: AsyncClient, db_with_user: User):
        """Test search with empty query."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        response = await async_test_client.get(
            "/api/v1/search/questions?q=",
            headers=headers
        )
        
        # Should return 400 for empty query or handle gracefully
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_200_OK]
    
    @pytest.mark.asyncio
    async def test_search_questions_with_limit(self, async_test_client: AsyncClient, sample_user: User):
        """Test search with custom limit parameter."""
        headers = {"X-User-Id": str(sample_user.id)}
        
        # Create user and study book with multiple questions
        await async_test_client.post("/api/v1/users", json={
            "name": sample_user.name,
            "email": sample_user.email
        })
        
        study_book_response = await async_test_client.post(
            "/api/v1/study-books",
            json={"title": "Python Basics"},
            headers=headers
        )
        study_book_id = study_book_response.json()["id"]
        
        # Create multiple questions with "Python" in them
        for i in range(5):
            await async_test_client.post(
                f"/api/v1/study-books/{study_book_id}/questions",
                json={
                    "language": "Python",
                    "category": "Basics",
                    "difficulty": "easy",
                    "question": f"Python question {i}?",
                    "answer": f"Python answer {i}."
                },
                headers=headers
            )
        
        # Search with limit
        response = await async_test_client.get(
            "/api/v1/search/questions?q=Python&limit=3",
            headers=headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert len(data["results"]) <= 3
    
    @pytest.mark.asyncio
    async def test_search_questions_no_auth(self, async_test_client: AsyncClient):
        """Test search without authentication."""
        response = await async_test_client.get("/api/v1/search/questions?q=test")
        
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_422_UNPROCESSABLE_ENTITY]
    
    @pytest.mark.asyncio
    async def test_search_result_format(self, async_test_client: AsyncClient, sample_user: User):
        """Test that search results have correct format."""
        headers = {"X-User-Id": str(sample_user.id)}
        
        # Create user and content
        await async_test_client.post("/api/v1/users", json={
            "name": sample_user.name,
            "email": sample_user.email
        })
        
        study_book_response = await async_test_client.post(
            "/api/v1/study-books",
            json={"title": "Test Book"},
            headers=headers
        )
        study_book_id = study_book_response.json()["id"]
        
        await async_test_client.post(
            f"/api/v1/study-books/{study_book_id}/questions",
            json={
                "language": "Python",
                "category": "Test",
                "difficulty": "easy",
                "question": "Test question about variables?",
                "answer": "Test answer about variables."
            },
            headers=headers
        )
        
        response = await async_test_client.get(
            "/api/v1/search/questions?q=variables",
            headers=headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        
        # Verify response structure
        assert "query" in data
        assert "results" in data
        assert "total_count" in data
        
        if data["results"]:
            result = data["results"][0]
            required_fields = ["question_id", "question", "answer", "highlight", "score"]
            for field in required_fields:
                assert field in result
            
            # Verify data types
            assert isinstance(result["score"], (int, float))
            assert isinstance(result["question"], str)
            assert isinstance(result["answer"], str)
            assert isinstance(result["highlight"], str)


class TestSearchUserScoping:
    """Test cases for user scoping in search functionality."""
    
    @pytest.mark.asyncio
    async def test_search_user_scoped_results(self, async_test_client: AsyncClient):
        """Test that search results are scoped to the authenticated user."""
        # Create two users
        user1_data = {"name": "User 1", "email": "user1@example.com"}
        user2_data = {"name": "User 2", "email": "user2@example.com"}
        
        response1 = await async_test_client.post("/api/v1/users", json=user1_data)
        response2 = await async_test_client.post("/api/v1/users", json=user2_data)
        
        user1_id = response1.json()["id"]
        user2_id = response2.json()["id"]
        
        headers1 = {"X-User-Id": user1_id}
        headers2 = {"X-User-Id": user2_id}
        
        # Each user creates a study book
        study_book1_response = await async_test_client.post(
            "/api/v1/study-books",
            json={"title": "User 1 Book"},
            headers=headers1
        )
        study_book2_response = await async_test_client.post(
            "/api/v1/study-books",
            json={"title": "User 2 Book"},
            headers=headers2
        )
        
        study_book1_id = study_book1_response.json()["id"]
        study_book2_id = study_book2_response.json()["id"]
        
        # Each user creates questions with unique content
        await async_test_client.post(
            f"/api/v1/study-books/{study_book1_id}/questions",
            json={
                "language": "Python",
                "category": "Test",
                "difficulty": "easy",
                "question": "User 1 unique question about variables?",
                "answer": "User 1 unique answer."
            },
            headers=headers1
        )
        
        await async_test_client.post(
            f"/api/v1/study-books/{study_book2_id}/questions",
            json={
                "language": "Python",
                "category": "Test",
                "difficulty": "easy",
                "question": "User 2 unique question about variables?",
                "answer": "User 2 unique answer."
            },
            headers=headers2
        )
        
        # User 1 searches - should only see their content
        response1 = await async_test_client.get(
            "/api/v1/search/questions?q=variables",
            headers=headers1
        )
        
        assert response1.status_code == status.HTTP_200_OK
        data1 = response1.json()
        
        for result in data1["results"]:
            assert "User 1" in result["question"] or "User 1" in result["answer"]
            assert "User 2" not in result["question"] and "User 2" not in result["answer"]
        
        # User 2 searches - should only see their content
        response2 = await async_test_client.get(
            "/api/v1/search/questions?q=variables",
            headers=headers2
        )
        
        assert response2.status_code == status.HTTP_200_OK
        data2 = response2.json()
        
        for result in data2["results"]:
            assert "User 2" in result["question"] or "User 2" in result["answer"]
            assert "User 1" not in result["question"] and "User 1" not in result["answer"]
    
    @pytest.mark.asyncio
    async def test_search_no_cross_user_leakage(self, async_test_client: AsyncClient):
        """Test that search never returns results from other users."""
        # Create user with content
        user1_data = {"name": "User 1", "email": "user1@example.com"}
        user2_data = {"name": "User 2", "email": "user2@example.com"}
        
        response1 = await async_test_client.post("/api/v1/users", json=user1_data)
        response2 = await async_test_client.post("/api/v1/users", json=user2_data)
        
        user1_id = response1.json()["id"]
        user2_id = response2.json()["id"]
        
        headers1 = {"X-User-Id": user1_id}
        headers2 = {"X-User-Id": user2_id}
        
        # User 1 creates content
        study_book_response = await async_test_client.post(
            "/api/v1/study-books",
            json={"title": "User 1 Book"},
            headers=headers1
        )
        study_book_id = study_book_response.json()["id"]
        
        await async_test_client.post(
            f"/api/v1/study-books/{study_book_id}/questions",
            json={
                "language": "Python",
                "category": "Test",
                "difficulty": "easy",
                "question": "Secret question with unique term xyzabc123?",
                "answer": "Secret answer with unique term xyzabc123."
            },
            headers=headers1
        )
        
        # User 2 searches for User 1's unique term
        response = await async_test_client.get(
            "/api/v1/search/questions?q=xyzabc123",
            headers=headers2
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # User 2 should not find User 1's content
        assert data["total_count"] == 0
        assert data["results"] == []