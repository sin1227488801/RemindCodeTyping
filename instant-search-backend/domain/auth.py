"""Authentication service interface and related types."""

from abc import ABC, abstractmethod
from uuid import UUID
from fastapi import Request
from typing import Optional

from .models import User


class AuthenticationService(ABC):
    """Abstract authentication service interface.
    
    This interface defines the contract for authentication services.
    Future implementations can include OIDC, JWT, or other authentication mechanisms.
    """
    
    @abstractmethod
    def get_current_user_id(self, request: Request) -> UUID:
        """Extract and validate the current user ID from the request.
        
        Args:
            request: FastAPI request object
            
        Returns:
            UUID of the authenticated user
            
        Raises:
            UnauthorizedAccessError: If user is not authenticated or invalid
        """
        pass
    
    @abstractmethod
    def create_user(self, name: str, email: str) -> UUID:
        """Create a new user account.
        
        Args:
            name: User's display name
            email: User's email address (must be unique)
            
        Returns:
            UUID of the created user
            
        Raises:
            ValidationError: If email is already in use or invalid data
        """
        pass
    
    @abstractmethod
    def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            User object if found, None otherwise
        """
        pass