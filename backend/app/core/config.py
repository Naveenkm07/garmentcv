from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Garment Measurement API"
    VERSION: str = "1.0.0"
    
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    STORAGE_PROVIDER: str = "local"
    STORAGE_PATH: str = "./uploads"
    
    HIGH_CONFIDENCE_THRESHOLD: float = 0.90
    MEDIUM_CONFIDENCE_THRESHOLD: float = 0.75

    model_config = ConfigDict(env_file="../.env", env_file_encoding="utf-8")

settings = Settings()
