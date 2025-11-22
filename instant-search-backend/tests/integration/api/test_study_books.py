"""
Integration tests for study book management endpoints.

Tests CRUD operations for study books with proper user scoping.
"""

import pytest
from httpx import AsyncClient
from fastapi import status
from uuid import uuid4

from domain.models import User, StudyBook


class TestStudyBookEndpoints:
    """Test cases for study book management endpoints."""
    
    @pytest.mark.asyncio
    async def test_create_study_book_success(self, async_test_client: AsyncClient, db_with_user: User):
        """Test creating a new study book successfully."""
        headers = {"X-User-Id": str(db_with_user.id)}
        study_book_data = {
            "title": "Python Programming",
            "description": "Learn Python basics"
        }
        
        response = await async_test_client.post(
            "/api/v1/study-books", 
            json=study_book_data, 
            headers=headers
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        
        data = response.json()
        assert data["title"] == study_book_data["title"]
        assert data["description"] == study_book_data["description"]
        assert data["user_id"] == str(db_with_user.id)
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
    
    @pytest.mark.asyncio
    async def test_create_study_book_without_description(self, async_test_client: AsyncClient, db_with_user: User):
        """Test creating a study book without description."""
        headers = {"X-User-Id": str(db_with_user.id)}
        study_book_data = {
            "title": "Python Programming"
        }
        
        response = await async_test_client.post(
            "/api/v1/study-books", 
            json=study_book_data, 
            headers=headers
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        
        data = response.json()
        assert data["title"] == study_book_data["title"]
        assert data["description"] is None
    
    @pytest.mark.asyncio
    async def test_create_study_book_empty_title(self, async_test_client: AsyncClient, db_with_user: User):
        """Test creating a study book with empty title fails."""
        headers = {"X-User-Id": str(db_with_user.id)}
        study_book_data = {
            "title": "",
            "description": "Test description"
        }
        
        response = await async_test_client.post(
            "/api/v1/study-books", 
            json=study_book_data, 
            headers=headers
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @pytest.mark.asyncio
    async def test_create_study_book_no_auth(self, async_test_client: AsyncClient):
        """Test creating a study book without authentication fails."""
        study_book_data = {
            "title": "Python Programming",
            "description": "Learn Python basics"
        }
        
        response = await async_test_client.post("/api/v1/study-books", json=study_book_data)
        
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_422_UNPROCESSABLE_ENTITY]
    
    @pytest.mark.asyncio
    async def test_get_study_books_success(self, async_test_client: AsyncClient, db_with_study_book: StudyBook, sample_user: User):
        """Test getting user's study books."""
        headers = {"X-User-Id": str(sample_user.id)}
        
        response = await async_test_client.get("/api/v1/study-books", headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == str(db_with_study_book.id)
        assert data[0]["title"] == db_with_study_book.title
        assert data[0]["user_id"] == str(sample_user.id)
    
    @pytest.mark.asyncio
    async def test_get_study_books_empty(self, async_test_client: AsyncClient, db_with_user: User):
        """Test getting study books when user has none."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        response = await async_test_client.get("/api/v1/study-books", headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    @pytest.mark.asyncio
    async def test_get_study_book_by_id_success(self, async_test_client: AsyncClient, db_with_study_book: StudyBook, sample_user: User):
        """Test getting a specific study book by ID."""
        headers = {"X-User-Id": str(sample_user.id)}
        
        response = await async_test_client.get(
            f"/api/v1/study-books/{db_with_study_book.id}", 
            headers=headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["id"] == str(db_with_study_book.id)
        assert data["title"] == db_with_study_book.title
        assert data["user_id"] == str(sample_user.id)
    
    @pytest.mark.asyncio
    async def test_get_study_book_not_found(self, async_test_client: AsyncClient, db_with_user: User):
        """Test getting a non-existent study book."""
        headers = {"X-User-Id": str(db_with_user.id)}
        non_existent_id = uuid4()
        
        response = await async_test_client.get(
            f"/api/v1/study-books/{non_existent_id}", 
            headers=headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        data = response.json()
        assert "error" in data
        assert data["error"] == "StudyBookNotFoundError"
    
    @pytest.mark.asyncio
    async def test_update_study_book_success(self, async_test_client: AsyncClient, db_with_study_book: StudyBook, sample_user: User):
        """Test updating a study book successfully."""
        headers = {"X-User-Id": str(sample_user.id)}
        update_data = {
            "title": "Advanced Python Programming",
            "description": "Learn advanced Python concepts"
        }
        
        response = await async_test_client.put(
            f"/api/v1/study-books/{db_with_study_book.id}",
            json=update_data,
            headers=headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["id"] == str(db_with_study_book.id)
        assert data["title"] == update_data["title"]
        assert data["description"] == update_data["description"]
        assert data["user_id"] == str(sample_user.id)
    
    @pytest.mark.asyncio
    async def test_update_study_book_partial(self, async_test_client: AsyncClient, db_with_study_book: StudyBook, sample_user: User):
        """Test partially updating a study book."""
        headers = {"X-User-Id": str(sample_user.id)}
        update_data = {
            "title": "Updated Title"
        }
        
        response = await async_test_client.put(
            f"/api/v1/study-books/{db_with_study_book.id}",
            json=update_data,
            headers=headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["description"] == db_with_study_book.description  # Should remain unchanged
    
    @pytest.mark.asyncio
    async def test_delete_study_book_success(self, async_test_client: AsyncClient, db_with_study_book: StudyBook, sample_user: User):
        """Test deleting a study book successfully."""
        headers = {"X-User-Id": str(sample_user.id)}
        
        response = await async_test_client.delete(
            f"/api/v1/study-books/{db_with_study_book.id}",
            headers=headers
        )
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify study book is deleted
        response = await async_test_client.get(
            f"/api/v1/study-books/{db_with_study_book.id}",
            headers=headers
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @pytest.mark.asyncio
    async def test_delete_study_book_not_found(self, async_test_client: AsyncClient, db_with_user: User):
        """Test deleting a non-existent study book."""
        headers = {"X-User-Id": str(db_with_user.id)}
        non_existent_id = uuid4()
        
        response = await async_test_client.delete(
            f"/api/v1/study-books/{non_existent_id}",
            headers=headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestStudyBookUserScoping:
    """Test cases for user scoping in study book operations."""
    
    @pytest.mark.asyncio
    async def test_user_cannot_access_other_users_study_books(self, async_test_client: AsyncClient, test_data_factory):
        """Test that users cannot access study books owned by other users."""
        # Create two users
        user1_data = {"name": "User 1", "email": "user1@example.com"}
        user2_data = {"name": "User 2", "email": "user2@example.com"}
        
        response1 = await async_test_client.post("/api/v1/users", json=user1_data)
        response2 = await async_test_client.post("/api/v1/users", json=user2_data)
        
        user1_id = response1.json()["id"]
        user2_id = response2.json()["id"]
        
        # User 1 creates a study book
        headers1 = {"X-User-Id": user1_id}
        study_book_data = {"title": "User 1's Study Book"}
        
        response = await async_test_client.post(
            "/api/v1/study-books",
            json=study_book_data,
            headers=headers1
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        study_book_id = response.json()["id"]
        
        # User 2 tries to access User 1's study book
        headers2 = {"X-User-Id": user2_id}
        response = await async_test_client.get(
            f"/api/v1/study-books/{study_book_id}",
            headers=headers2
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @pytest.mark.asyncio
    async def test_user_cannot_modify_other_users_study_books(self, async_test_client: AsyncClient):
        """Test that users cannot modify study books owned by other users."""
        # Create two users
        user1_data = {"name": "User 1", "email": "user1@example.com"}
        user2_data = {"name": "User 2", "email": "user2@example.com"}
        
        response1 = await async_test_client.post("/api/v1/users", json=user1_data)
        response2 = await async_test_client.post("/api/v1/users", json=user2_data)
        
        user1_id = response1.json()["id"]
        user2_id = response2.json()["id"]
        
        # User 1 creates a study book
        headers1 = {"X-User-Id": user1_id}
        study_book_data = {"title": "User 1's Study Book"}
        
        response = await async_test_client.post(
            "/api/v1/study-books",
            json=study_book_data,
            headers=headers1
        )
        
        study_book_id = response.json()["id"]
        
        # User 2 tries to update User 1's study book
        headers2 = {"X-User-Id": user2_id}
        update_data = {"title": "Hacked Title"}
        
        response = await async_test_client.put(
            f"/api/v1/study-books/{study_book_id}",
            json=update_data,
            headers=headers2
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        # User 2 tries to delete User 1's study book
        response = await async_test_client.delete(
            f"/api/v1/study-books/{study_book_id}",
            headers=headers2
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @pytest.mark.asyncio
    async def test_user_study_books_list_scoped(self, async_test_client: AsyncClient):
        """Test that study book list is properly scoped to user."""
        # Create two users
        user1_data = {"name": "User 1", "email": "user1@example.com"}
        user2_data = {"name": "User 2", "email": "user2@example.com"}
        
        response1 = await async_test_client.post("/api/v1/users", json=user1_data)
        response2 = await async_test_client.post("/api/v1/users", json=user2_data)
        
        user1_id = response1.json()["id"]
        user2_id = response2.json()["id"]
        
        # Each user creates study books
        headers1 = {"X-User-Id": user1_id}
        headers2 = {"X-User-Id": user2_id}
        
        await async_test_client.post(
            "/api/v1/study-books",
            json={"title": "User 1 Book 1"},
            headers=headers1
        )
        await async_test_client.post(
            "/api/v1/study-books",
            json={"title": "User 1 Book 2"},
            headers=headers1
        )
        await async_test_client.post(
            "/api/v1/study-books",
            json={"title": "User 2 Book 1"},
            headers=headers2
        )
        
        # User 1 should only see their books
        response = await async_test_client.get("/api/v1/study-books", headers=headers1)
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert len(data) == 2
        for book in data:
            assert book["user_id"] == user1_id
            assert "User 1" in book["title"]
        
        # User 2 should only see their books
        response = await async_test_client.get("/api/v1/study-books", headers=headers2)
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["user_id"] == user2_id
        assert "User 2" in data[0]["title"]