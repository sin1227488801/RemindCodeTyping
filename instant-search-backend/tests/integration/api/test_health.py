"""
Integration tests for health check endpoints.

Tests health monitoring functionality with database connectivity checks.
"""

import pytest
from httpx import AsyncClient
from fastapi import status


class TestHealthEndpoints:
    """Test cases for health check endpoints."""
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, async_test_client: AsyncClient):
        """Test health check endpoint returns healthy status."""
        response = await async_test_client.get("/healthz")
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "timestamp" in data
        assert "checks" in data
        assert "database" in data["checks"]
        assert data["checks"]["database"]["status"] == "ok"
    
    @pytest.mark.asyncio
    async def test_health_check_includes_search_status(self, async_test_client: AsyncClient):
        """Test health check includes search index status."""
        response = await async_test_client.get("/healthz")
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "search" in data["checks"]
        # Search status can be ok or error depending on index state
        assert data["checks"]["search"]["status"] in ["ok", "error"]
    
    @pytest.mark.asyncio
    async def test_health_check_response_format(self, async_test_client: AsyncClient):
        """Test health check response has correct format."""
        response = await async_test_client.get("/healthz")
        
        data = response.json()
        
        # Verify required fields
        required_fields = ["status", "version", "timestamp", "checks"]
        for field in required_fields:
            assert field in data
        
        # Verify status is one of expected values
        assert data["status"] in ["healthy", "degraded", "unhealthy"]
        
        # Verify checks structure
        assert isinstance(data["checks"], dict)
        for check_name, check_data in data["checks"].items():
            assert "status" in check_data
            assert check_data["status"] in ["ok", "error"]
    
    @pytest.mark.asyncio
    async def test_health_check_headers(self, async_test_client: AsyncClient):
        """Test health check response includes proper headers."""
        response = await async_test_client.get("/healthz")
        
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["content-type"] == "application/json"
        
        # Should include trace ID header
        assert "x-trace-id" in response.headers