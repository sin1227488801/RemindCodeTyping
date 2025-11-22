"""User management API endpoints."""

from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr

from api.dependencies import get_current_user_id, get_auth_service
from domain.exceptions import ValidationError
from domain.models import User

router = APIRouter(prefix="/users", tags=["users"])


class UserCreateRequest(BaseModel):
    """Request model for user creation."""
    name: str
    email: EmailStr


class UserResponse(BaseModel):
    """Response model for user data."""
    id: UUID
    name: str
    email: str
    created_at: str
    updated_at: str

    @classmethod
    def from_domain_model(cls, user: User) -> "UserResponse":
        """Convert domain model to response model."""
        return cls(
            id=user.id,
            name=user.name,
            email=user.email,
            created_at=user.created_at.isoformat() + 'Z',
            updated_at=user.updated_at.isoformat() + 'Z'
        )


class UserCreateResponse(BaseModel):
    """Response model for user creation."""
    id: UUID
    message: str


class LoginRequest(BaseModel):
    """Request model for user login."""
    loginId: str
    password: str


class LoginResponse(BaseModel):
    """Response model for user login."""
    id: UUID
    name: str
    email: str
    message: str


@router.post("/login", response_model=LoginResponse)
def login_user(request: LoginRequest, auth_service = Depends(get_auth_service)):
    """Login user with loginId and password.
    
    For demo purposes, accepts 'demo'/'password' or any existing user email.
    Returns user information for successful login.
    """
    try:
        # Demo login
        if request.loginId == "demo" and request.password == "password":
            # Try to find existing demo user or create one
            demo_email = "demo@example.com"
            existing_user = auth_service._run_async(auth_service.user_repository.get_by_email(demo_email))
            
            if not existing_user:
                # Create demo user
                user_id = auth_service.create_user("Demo User", demo_email)
                user = auth_service.get_user_by_id(user_id)
            else:
                user = existing_user
            
            return LoginResponse(
                id=user.id,
                name=user.name,
                email=user.email,
                message="Login successful"
            )
        
        # Try to find user by email (treating loginId as email)
        user = auth_service._run_async(auth_service.user_repository.get_by_email(request.loginId))
        if user:
            return LoginResponse(
                id=user.id,
                name=user.name,
                email=user.email,
                message="Login successful"
            )
        
        # User not found
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login credentials"
        )
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/signup", response_model=UserCreateResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    request: UserCreateRequest,
    auth_service = Depends(get_auth_service)
):
    """Create a new user account.
    
    Creates a new user with email uniqueness validation.
    This endpoint does not require authentication.
    """
    try:
        user_id = auth_service.create_user(request.name, request.email)
        return UserCreateResponse(
            id=user_id,
            message="User created successfully"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/me", response_model=UserResponse)
def get_current_user(
    user_id: UUID = Depends(get_current_user_id),
    auth_service = Depends(get_auth_service)
):
    """Get current authenticated user information.
    
    Returns the profile information for the currently authenticated user.
    Requires X-User-Id header or creates a default test user for development.
    """
    user = auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse.from_domain_model(user)


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    auth_service = Depends(get_auth_service)
):
    """Get user by ID.
    
    For security, users can only access their own profile information.
    """
    # Ensure users can only access their own data
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: can only access your own profile"
        )
    
    user = auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse.from_domain_model(user)