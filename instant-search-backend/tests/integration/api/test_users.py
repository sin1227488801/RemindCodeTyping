"""
Integration tests for user management endpoints.

Tests user creation, authentication, and user scoping functionality.
"""

import pytest
from httpx import AsyncClient
from fastapi import status
from uuid import uuid4

from domain.models import User


class TestUserEndpoints:
    """Test cases for user management endpoints."""
    
    @pytest.mark.asyncio
    async def test_create_user_success(self, async_test_client: AsyncClient):
        """Test creating a new user successfully."""
        user_data = {
            "name": "John Doe",
            "email": "john.doe@example.com"
        }
        
        response = await async_test_client.post("/api/v1/users", json=user_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        
        data = response.json()
        assert data["name"] == user_data["name"]
        assert data["email"] == user_data["email"]
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
    
    @pytest.mark.asyncio
    async def test_create_user_duplicate_email(self, async_test_client: AsyncClient):
        """Test creating a user with duplicate email fails."""
        user_data = {
            "name": "John Doe",
            "email": "john.doe@example.com"
        }
        
        # Create first user
        response1 = await async_test_client.post("/api/v1/users", json=user_data)
        assert response1.status_code == status.HTTP_201_CREATED
        
        # Try to create second user with same email
        user_data["name"] = "Jane Doe"
        response2 = await async_test_client.post("/api/v1/users", json=user_data)
        
        assert response2.status_code == status.HTTP_400_BAD_REQUEST
        
        data = response2.json()
        assert "error" in data
        assert "email" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_create_user_invalid_email(self, async_test_client: AsyncClient):
        """Test creating a user with invalid email format fails."""
        user_data = {
            "name": "John Doe",
            "email": "invalid-email"
        }
        
        response = await async_test_client.post("/api/v1/users", json=user_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        data = response.json()
        assert "error" in data
        assert data["error"] == "ValidationError"
    
    @pytest.mark.asyncio
    async def test_create_user_empty_name(self, async_test_client: AsyncClient):
        """Test creating a user with empty name fails."""
        user_data = {
            "name": "",
            "email": "john.doe@example.com"
        }
        
        response = await async_test_client.post("/api/v1/users", json=user_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        data = response.json()
        assert "error" in data
        assert data["error"] == "ValidationError"
    
    @pytest.mark.asyncio
    async def test_create_user_email_case_insensitive(self, async_test_client: AsyncClient):
        """Test that email is stored in lowercase."""
        user_data = {
            "name": "John Doe",
            "email": "JOHN.DOE@EXAMPLE.COM"
        }
        
        response = await async_test_client.post("/api/v1/users", json=user_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        
        data = response.json()
        assert data["email"] == "john.doe@example.com"
    
    @pytest.mark.asyncio
    async def test_get_current_user_success(self, async_test_client: AsyncClient, db_with_user: User):
        """Test getting current user information."""
        headers = {"X-User-Id": str(db_with_user.id)}
        
        response = await async_test_client.get("/api/v1/users/me", headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["id"] == str(db_with_user.id)
        assert data["name"] == db_with_user.name
        assert data["email"] == db_with_user.email
    
    @pytest.mark.asyncio
    async def test_get_current_user_not_found(self, async_test_client: AsyncClient):
        """Test getting current user when user doesn't exist."""
        headers = {"X-User-Id": str(uuid4())}
        
        response = await async_test_client.get("/api/v1/users/me", headers=headers)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        data = response.json()
        assert "error" in data
        assert data["error"] == "UserNotFoundError"
    
    @pytest.mark.asyncio
    async def test_get_current_user_no_auth_header(self, async_test_client: AsyncClient):
        """Test getting current user without authentication header."""
        response = await async_test_client.get("/api/v1/users/me")
        
        # Should return 401 or 422 depending on middleware implementation
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_422_UNPROCESSABLE_ENTITY]
    
    @pytest.mark.asyncio
    async def test_get_current_user_invalid_uuid(self, async_test_client: AsyncClient):
        """Test getting current user with invalid UUID format."""
        headers = {"X-User-Id": "invalid-uuid"}
        
        response = await async_test_client.get("/api/v1/users/me", headers=headers)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @pytest.mark.asyncio
    async def test_user_response_includes_trace_id(self, async_test_client: AsyncClient):
        """Test that user endpoints include trace ID in response."""
        user_data = {
            "name": "John Doe",
            "email": "john.doe@example.com"
        }
        
        response = await async_test_client.post("/api/v1/users", json=user_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert "x-trace-id" in response.headers
        
        # Trace ID should be a valid UUID format
        trace_id = response.headers["x-trace-id"]
        assert len(trace_id) == 36  # UUID string length
        assert trace_id.count("-") == 4  # UUID has 4 hyphens


class TestUserAuthentication:
    """Test cases for user authentication and authorization."""
    
    @pytest.mark.asyncio
    async def test_user_scoping_isolation(self, async_test_client: AsyncClient):
        """Test that users can only access their own data."""
        # Create two users
        user1_data = {"name": "User 1", "email": "user1@example.com"}
        user2_data = {"name": "User 2", "email": "user2@example.com"}
        
        response1 = await async_test_client.post("/api/v1/users", json=user1_data)
        response2 = await async_test_client.post("/api/v1/users", json=user2_data)
        
        assert response1.status_code == status.HTTP_201_CREATED
        assert response2.status_code == status.HTTP_201_CREATED
        
        user1_id = response1.json()["id"]
        user2_id = response2.json()["id"]
        
        # User 1 should only see their own data
        headers1 = {"X-User-Id": user1_id}
        response = await async_test_client.get("/api/v1/users/me", headers=headers1)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == user1_id
        assert data["email"] == "user1@example.com"
        
        # User 2 should only see their own data
        headers2 = {"X-User-Id": user2_id}
        response = await async_test_client.get("/api/v1/users/me", headers=headers2)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == user2_id
        assert data["email"] == "user2@example.com"
    
    @pytest.mark.asyncio
    async def test_mock_authentication_service(self, async_test_client: AsyncClient):
        """Test that mock authentication service works correctly."""
        # Create a user
        user_data = {"name": "Test User", "email": "test@example.com"}
        response = await async_test_client.post("/api/v1/users", json=user_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        user_id = response.json()["id"]
        
        # Use the user ID in X-User-Id header
        headers = {"X-User-Id": user_id}
        response = await async_test_client.get("/api/v1/users/me", headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify the authentication service correctly identified the user
        data = response.json()
        assert data["id"] == user_id