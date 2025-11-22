"""Mock authentication service implementation for development."""

import asyncio
from uuid import UUID, uuid4
from datetime import datetime
from fastapi import Request
from typing import Optional

from domain.auth import AuthenticationService
from domain.models import User
from domain.repositories import UserRepository
from domain.exceptions import UnauthorizedAccessError, ValidationError


class MockAuthenticationService(AuthenticationService):
    """Mock authentication service for development and testing.
    
    This implementation uses the X-User-Id header for authentication.
    If no header is provided, it can create mock users for testing.
    
    Future: Replace with OIDC or JWT-based authentication.
    """
    
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository
    
    def _run_async(self, coro):
        """Helper method to run async repository methods synchronously.
        
        This is a temporary bridge until we align async/sync patterns across the codebase.
        """
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(coro)
        except RuntimeError:
            return asyncio.run(coro)
    
    def get_current_user_id(self, request: Request) -> UUID:
        """Extract user ID from X-User-Id header or create a mock user.
        
        For development convenience, if no X-User-Id header is provided,
        this will create a default test user.
        """
        user_id_header = request.headers.get("X-User-Id")
        
        if user_id_header:
            try:
                user_id = UUID(user_id_header)
                user = self._run_async(self.user_repository.get_by_id(user_id))
                
                if user:
                    return user_id
                else:
                    # User doesn't exist - create a new user with this ID
                    # This allows frontend to maintain consistent user IDs
                    now = datetime.utcnow()
                    new_user = User(
                        id=user_id,
                        name=f"User {user_id}",
                        email=f"user-{user_id}@example.com",
                        created_at=now,
                        updated_at=now
                    )
                    created_user = self._run_async(self.user_repository.create(new_user))
                    return created_user.id
            except ValueError:
                raise ValidationError("user_id", user_id_header, "Invalid user ID format in X-User-Id header")
        
        # For development: create a default test user if none provided
        default_email = "test@example.com"
        existing_user = self._run_async(self.user_repository.get_by_email(default_email))
        
        if existing_user:
            return existing_user.id
        
        # Create default test user
        return self.create_user("Test User", default_email)
    
    def create_user(self, name: str, email: str) -> UUID:
        """Create a new user account with validation."""
        # Validate input
        if not name or not name.strip():
            raise ValidationError("Name cannot be empty")
        
        if not email or not email.strip():
            raise ValidationError("Email cannot be empty")
        
        # Normalize email
        normalized_email = email.strip().lower()
        
        # Check if email already exists
        existing_user = self._run_async(self.user_repository.get_by_email(normalized_email))
        if existing_user:
            raise ValidationError(f"User with email {email} already exists")
        
        # Create new user
        user_id = uuid4()
        now = datetime.utcnow()
        
        user = User(
            id=user_id,
            name=name.strip(),
            email=normalized_email,
            created_at=now,
            updated_at=now
        )
        
        created_user = self._run_async(self.user_repository.create(user))
        return created_user.id
    
    def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        return self._run_async(self.user_repository.get_by_id(user_id))