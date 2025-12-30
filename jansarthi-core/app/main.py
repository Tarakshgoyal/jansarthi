from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_db_and_tables
from app.routes.auth import auth_router
from app.routes.parshad import parshad_router
from app.routes.pwd import pwd_router
from app.routes.reports import reports_router
from app.settings.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup: Create database tables
    print("Creating database tables...")
    create_db_and_tables()
    print("Database tables created successfully!")
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
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(reports_router)
app.include_router(auth_router) # Auth API
app.include_router(pwd_router)  # PWD Worker APIs
app.include_router(parshad_router)  # Parshad APIs


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
