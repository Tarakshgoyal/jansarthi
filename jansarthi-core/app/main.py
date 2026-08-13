from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.database import create_db_and_tables, engine
from app.routes.admin import admin_router
from app.routes.auth import auth_router
from app.routes.parshad import parshad_router
from app.routes.pwd import pwd_router
from app.routes.reports import reports_router
from app.services.storage import get_storage_service
from app.settings.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    if settings.environment != "production":
        create_db_and_tables()
    yield
    # Shutdown: Cleanup if needed
    print("Shutting down application...")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API for Jansarthi - Citizen Issue Reporting Platform",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def prevent_api_caching(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/") or request.url.path in {"/health", "/ready"}:
        response.headers["Cache-Control"] = "no-store"
    return response

# Include routers
app.include_router(reports_router)
app.include_router(auth_router)  # Auth API
app.include_router(admin_router)  # Admin APIs (localities, user management)
app.include_router(pwd_router)  # PWD Worker APIs
app.include_router(parshad_router)  # Representative APIs


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Jansarthi API",
        "version": settings.app_version,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
    }


@app.get("/ready", tags=["Health"])
def readiness_check():
    """Check that the API can reach both persistent dependencies."""
    checks = {"database": "unavailable", "storage": "unavailable"}
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        checks["database"] = "ready"
        get_storage_service().check_connection()
        checks["storage"] = "ready"
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "checks": checks},
        )

    return {"status": "ready", "checks": checks}
