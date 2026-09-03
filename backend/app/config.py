import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "VyomDrishti AI Backend"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite:///./VyomDrishti.db"
    
    # Uploads Storage
    UPLOAD_DIR: str = "uploads"
    
    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        case_sensitive = True
        env_prefix = "VyomDrishti_"

# Instantiate settings
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
