from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Intelligent Road Safety & Blind-Turn Hazard Detection System"
    VERSION: str = "1.0.0"
    
    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]
    
    # Mode switch
    DEMO_MODE: bool = True
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
