import os
from functools import lru_cache
from urllib.parse import urlparse

from dotenv import load_dotenv


load_dotenv()


def _env_bool(name: str, default: bool) -> bool:
    return os.getenv(name, str(default)).lower() == "true"


def _env_int(name: str, default: int) -> int:
    return int(os.getenv(name, str(default)))


def _database_url() -> str:
    configured_url = os.getenv("DATABASE_URL")
    if configured_url:
        return configured_url

    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "mysecretpassword")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    database = os.getenv("POSTGRES_DATABASE", "postgres")
    return f"postgresql://{user}:{password}@{host}:{port}/{database}"


def _cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


class Settings:
    """Application settings loaded once from environment variables."""

    environment: str = os.getenv("ENVIRONMENT", "development").lower()

    # Database. Neon supplies a pooled URL for the API and a direct URL for Alembic.
    database_url: str = _database_url()
    migration_database_url: str = os.getenv("MIGRATION_DATABASE_URL", database_url)
    database_pool_size: int = _env_int("DATABASE_POOL_SIZE", 5)
    database_max_overflow: int = _env_int("DATABASE_MAX_OVERFLOW", 5)

    # S3-compatible storage. Legacy MINIO_* names keep local development compatible.
    s3_endpoint: str = os.getenv(
        "S3_ENDPOINT", os.getenv("MINIO_ENDPOINT", "localhost:9000")
    )
    s3_access_key: str = os.getenv(
        "S3_ACCESS_KEY", os.getenv("MINIO_USER", "admin")
    )
    s3_secret_key: str = os.getenv(
        "S3_SECRET_KEY", os.getenv("MINIO_PASSWORD", "YourPassword123")
    )
    s3_bucket: str = os.getenv(
        "S3_BUCKET", os.getenv("MINIO_BUCKET", "jansarthi-images")
    )
    s3_secure: bool = _env_bool(
        "S3_SECURE",
        os.getenv("MINIO_SECURE", "false").lower() == "true",
    )
    s3_region: str | None = os.getenv("S3_REGION") or None
    presigned_url_expiry_seconds: int = _env_int(
        "PRESIGNED_URL_EXPIRY_SECONDS", 3600
    )

    # Backward-compatible attribute names used by older code and local scripts.
    minio_endpoint: str = s3_endpoint
    minio_user: str = s3_access_key
    minio_password: str = s3_secret_key
    minio_bucket: str = s3_bucket
    minio_secure: bool = s3_secure

    app_name: str = os.getenv("APP_NAME", "Jansarthi API")
    app_version: str = os.getenv("APP_VERSION", "0.1.0")
    debug: bool = _env_bool("DEBUG", environment != "production")
    cors_origins: list[str] = _cors_origins()

    max_file_size: int = _env_int("MAX_FILE_SIZE", 10 * 1024 * 1024)
    max_photos_per_issue: int = _env_int("MAX_PHOTOS_PER_ISSUE", 3)
    allowed_image_types: set[str] = {
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
    }

    otp_service_api_key: str = os.getenv("OTP_SERVICE_API_KEY", "your_api_key")
    otp_expiry_minutes: int = _env_int("OTP_EXPIRY_MINUTES", 10)
    otp_length: int = 6
    otp_request_cooldown_seconds: int = _env_int(
        "OTP_REQUEST_COOLDOWN_SECONDS", 60
    )
    otp_http_timeout_seconds: float = float(
        os.getenv("OTP_HTTP_TIMEOUT_SECONDS", "10")
    )

    jwt_secret_key: str = os.getenv(
        "JWT_SECRET_KEY", "your-secret-key-change-this-in-production"
    )
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_access_token_expire_minutes: int = _env_int(
        "JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 60
    )
    jwt_refresh_token_expire_days: int = _env_int(
        "JWT_REFRESH_TOKEN_EXPIRE_DAYS", 30
    )

    dev_mode: bool = _env_bool("DEV_MODE", False)
    dev_default_otp: str = os.getenv("DEV_DEFAULT_OTP", "999999")

    def validate(self) -> None:
        if self.environment != "production":
            return

        errors: list[str] = []
        parsed_database = urlparse(self.database_url)
        if not parsed_database.hostname or parsed_database.hostname in {
            "localhost",
            "127.0.0.1",
            "postgres",
        }:
            errors.append("DATABASE_URL must reference the production database")
        if self.jwt_secret_key == "your-secret-key-change-this-in-production":
            errors.append("JWT_SECRET_KEY must be changed")
        if self.otp_service_api_key in {"", "your_api_key"}:
            errors.append("OTP_SERVICE_API_KEY must be configured")
        if self.dev_mode:
            errors.append("DEV_MODE must be false")
        if self.s3_secret_key in {"", "YourPassword123"}:
            errors.append("S3_SECRET_KEY must be configured")
        if not self.s3_secure:
            errors.append("S3_SECURE must be true")
        if not self.cors_origins:
            errors.append("CORS_ORIGINS must contain at least one origin")

        if errors:
            raise RuntimeError("Invalid production configuration: " + "; ".join(errors))


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    settings.validate()
    return settings
