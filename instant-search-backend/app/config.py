"""Application configuration management."""

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )
    
    # Application settings
    app_name: str = "instant-search-backend"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Database settings
    database_url: str = "sqlite:///./data/app.db"
    
    # Logging settings
    log_level: str = "INFO"
    
    # Authentication settings (for future OIDC)
    auth_enabled: bool = False
    
    # Compatibility endpoints settings
    enable_compatibility_endpoints: bool = True
    system_problems_cache_size: int = 128
    default_problems_per_language: int = 25


# Global settings instance
settings = Settings()