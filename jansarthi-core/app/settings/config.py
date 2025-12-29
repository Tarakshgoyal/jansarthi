import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

# MinIO Configuration
MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_USER: str = os.getenv("MINIO_USER", "admin")
MINIO_PASSWORD: str = os.getenv("MINIO_PASSWORD", "YourPassword123")
MINIO_BUCKET: str = os.getenv("MINIO_BUCKET", "jansarthi-images")
MINIO_SECURE: bool = os.getenv("MINIO_SECURE", "false").lower() == "true"

# PostgreSQL Configuration
POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "mysecretpassword")
POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_DATABASE: str = os.getenv("POSTGRES_DATABASE", "postgres")
POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))



# OTP Service Configuration (2Factor.in)
OTP_SERVICE_API_KEY: str = os.getenv("OTP_SERVICE_API_KEY", "your_api_key")

# JWT Configuration
JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))  # 1 hour
JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "30"))  # 30 days

# OTP Configuration
OTP_EXPIRY_MINUTES: int = int(os.getenv("OTP_EXPIRY_MINUTES", "10"))  # 10 minutes
OTP_LENGTH: int = 6

# Database URL
DATABASE_URL: str = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@"
    f"{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DATABASE}"
)


class Settings:
    """Application settings"""

    # Database
    database_url: str = DATABASE_URL

    # MinIO/S3
    minio_endpoint: str = MINIO_ENDPOINT
    minio_user: str = MINIO_USER
    minio_password: str = MINIO_PASSWORD
    minio_bucket: str = MINIO_BUCKET
    minio_secure: bool = MINIO_SECURE

    # Application
    app_name: str = "Jansarthi API"
    app_version: str = "0.1.0"
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"

    # File upload limits
    max_file_size: int = 10 * 1024 * 1024  # 10 MB
    max_photos_per_issue: int = 3
    allowed_image_types: set = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
    
    # OTP Service (2Factor.in)
    otp_service_api_key: str = OTP_SERVICE_API_KEY
    
    # JWT
    jwt_secret_key: str = JWT_SECRET_KEY
    jwt_algorithm: str = JWT_ALGORITHM
    jwt_access_token_expire_minutes: int = JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    jwt_refresh_token_expire_days: int = JWT_REFRESH_TOKEN_EXPIRE_DAYS
    
    # OTP
    otp_expiry_minutes: int = OTP_EXPIRY_MINUTES
    otp_length: int = OTP_LENGTH


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
