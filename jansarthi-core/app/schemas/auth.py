"""Schemas for authentication and user management"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class UserRole(str, Enum):
    """User role enum for API responses"""
    USER = "user"
    PARSHAD = "parshad"
    PWD_WORKER = "pwd_worker"


# User Schemas
class UserCreate(BaseModel):
    """Schema for creating a new user"""
    name: str = Field(..., min_length=1, max_length=255, description="User's full name")
    mobile_number: str = Field(
        ..., 
        min_length=10, 
        max_length=15, 
        pattern=r"^\+?[1-9]\d{9,14}$",
        description="User's mobile number (with country code)"
    )


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    name: str
    mobile_number: str
    role: UserRole = UserRole.USER
    is_active: bool
    is_verified: bool
    village_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Authentication Schemas
class SignupRequest(BaseModel):
    """Schema for user signup"""
    name: str = Field(..., min_length=1, max_length=255)
    mobile_number: str = Field(
        ..., 
        min_length=10, 
        max_length=15,
        pattern=r"^\+?[1-9]\d{9,14}$",
        description="Mobile number with country code (e.g., +919876543210)"
    )


class LoginRequest(BaseModel):
    """Schema for user login"""
    mobile_number: str = Field(
        ..., 
        min_length=10, 
        max_length=15,
        pattern=r"^\+?[1-9]\d{9,14}$"
    )


class VerifyOTPRequest(BaseModel):
    """Schema for OTP verification"""
    mobile_number: str = Field(..., min_length=10, max_length=15)
    otp_code: str = Field(..., min_length=6, max_length=6)


class OTPResponse(BaseModel):
    """Schema for OTP send response"""
    message: str
    mobile_number: str
    expires_in_minutes: int


class TokenResponse(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Schema for token refresh"""
    refresh_token: str


class TokenData(BaseModel):
    """Schema for decoded token data"""
    user_id: Optional[int] = None
    mobile_number: Optional[str] = None
    token_type: Optional[str] = None  # "access" or "refresh"
