from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.issue import OTP, User
from app.schemas.auth import (
    LoginRequest,
    OTPResponse,
    RefreshTokenRequest,
    SignupRequest,
    TokenResponse,
    UserResponse,
    VerifyOTPRequest,
)
from app.services.auth import AuthService, get_current_user
from app.services.twilio import get_otp_service, normalize_phone_number
from app.settings.config import get_settings

settings = get_settings()
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@auth_router.post(
    "/signup",
    response_model=OTPResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Signup with mobile number",
)
async def signup(
    signup_data: SignupRequest,
    session: Session = Depends(get_session),
):
    """
    Register a new user and send OTP for verification
    
    - **name**: User's full name
    - **mobile_number**: Mobile number with country code (e.g., +919876543210 or 9876543210)
    
    Returns OTP details. Use /verify-otp endpoint to complete signup.
    """
    # Normalize phone number to E.164 format
    normalized_number = normalize_phone_number(signup_data.mobile_number)
    
    # Check if user already exists
    existing_user = session.exec(
        select(User).where(User.mobile_number == normalized_number)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this mobile number already exists. Please login instead."
        )
    
    # Create user (not verified yet)
    new_user = User(
        name=signup_data.name,
        mobile_number=normalized_number,
        is_verified=False,
        is_active=True
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    # Send OTP via 2Factor API (generates and sends automatically)
    otp_service = get_otp_service()
    sms_sent, session_id = otp_service.send_otp(normalized_number)
    
    if not sms_sent or not session_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP. Please try again."
        )
    
    # Save OTP session to database
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expiry_minutes)
    otp_record = OTP(
        mobile_number=normalized_number,
        session_id=session_id,
        expires_at=expires_at,
        is_used=False
    )
    
    session.add(otp_record)
    session.commit()
    
    return OTPResponse(
        message="OTP sent successfully to your mobile number",
        mobile_number=normalized_number,
        expires_in_minutes=settings.otp_expiry_minutes
    )


@auth_router.post(
    "/login",
    response_model=OTPResponse,
    summary="Login with mobile number",
)
async def login(
    login_data: LoginRequest,
    session: Session = Depends(get_session),
):
    """
    Login with mobile number and receive OTP
    
    - **mobile_number**: Registered mobile number with country code (e.g., +919876543210 or 9876543210)
    
    Returns OTP details. Use /verify-otp endpoint to complete login.
    """
    # Normalize phone number to E.164 format
    normalized_number = normalize_phone_number(login_data.mobile_number)
    
    # Check if user exists
    user = session.exec(
        select(User).where(User.mobile_number == normalized_number)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please signup first."
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support."
        )
    
    # Send OTP via 2Factor API (generates and sends automatically)
    otp_service = get_otp_service()
    sms_sent, session_id = otp_service.send_otp(normalized_number)
    
    if not sms_sent or not session_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP. Please try again."
        )
    
    # Save OTP session to database
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expiry_minutes)
    otp_record = OTP(
        mobile_number=normalized_number,
        session_id=session_id,
        expires_at=expires_at,
        is_used=False
    )
    
    session.add(otp_record)
    session.commit()
    
    return OTPResponse(
        message="OTP sent successfully to your mobile number",
        mobile_number=normalized_number,
        expires_in_minutes=settings.otp_expiry_minutes
    )


@auth_router.post(
    "/verify-otp",
    response_model=TokenResponse,
    summary="Verify OTP and get access token",
)
async def verify_otp(
    verify_data: VerifyOTPRequest,
    session: Session = Depends(get_session),
):
    """
    Verify OTP and receive JWT access and refresh tokens
    
    - **mobile_number**: Mobile number that received the OTP (e.g., +919876543210 or 9876543210)
    - **otp_code**: 6-digit OTP code
    
    Returns JWT tokens for authenticated requests.
    """
    # Normalize phone number to E.164 format
    normalized_number = normalize_phone_number(verify_data.mobile_number)
    
    # Get user
    user = session.exec(
        select(User).where(User.mobile_number == normalized_number)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get the latest unused OTP for this number
    otp_record = session.exec(
        select(OTP)
        .where(OTP.mobile_number == normalized_number)
        .where(OTP.is_used == False)
        .order_by(OTP.created_at.desc())
    ).first()
    
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid OTP found. Please request a new one."
        )
    
    # Check if OTP is expired
    if datetime.now(timezone.utc) > otp_record.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one."
        )
    
    # Check attempt count (prevent brute force)
    if otp_record.attempt_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Please request a new OTP."
        )
    
    # Verify OTP via 2Factor API
    otp_service = get_otp_service()
    is_valid = otp_service.verify_otp(otp_record.session_id, verify_data.otp_code)
    
    if not is_valid:
        otp_record.attempt_count += 1
        session.add(otp_record)
        session.commit()
        
        remaining_attempts = 3 - otp_record.attempt_count
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP. {remaining_attempts} attempts remaining."
        )
    
    # Mark OTP as used
    otp_record.is_used = True
    otp_record.used_at = datetime.now(timezone.utc)
    
    # Mark user as verified if first time
    if not user.is_verified:
        user.is_verified = True
    
    session.add(otp_record)
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Generate JWT tokens
    tokens = AuthService.create_token_pair(user.id, user.mobile_number)
    
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type=tokens["token_type"],
        expires_in=tokens["expires_in"],
        user=UserResponse.model_validate(user)
    )

@auth_router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    session: Session = Depends(get_session),
):
    """
    Refresh access token using refresh token
    
    - **refresh_token**: Valid refresh token received from login/signup
    
    Returns new access and refresh tokens.
    """
    # Verify refresh token
    token_data = AuthService.verify_token(refresh_data.refresh_token, token_type="refresh")
    
    # Get user
    user = session.get(User, token_data.user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Generate new token pair
    tokens = AuthService.create_token_pair(user.id, user.mobile_number)
    
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type=tokens["token_type"],
        expires_in=tokens["expires_in"],
        user=UserResponse.model_validate(user)
    )


@auth_router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    Get current authenticated user's profile
    
    Requires valid access token in Authorization header.
    """
    return current_user


@auth_router.post(
    "/resend-otp",
    response_model=OTPResponse,
    summary="Resend OTP",
)
async def resend_otp(
    mobile_data: LoginRequest,
    session: Session = Depends(get_session),
):
    """
    Resend OTP to mobile number
    
    - **mobile_number**: Mobile number that needs new OTP (e.g., +919876543210 or 9876543210)
    
    Can be used if previous OTP expired or wasn't received.
    """
    # Normalize phone number to E.164 format
    normalized_number = normalize_phone_number(mobile_data.mobile_number)
    
    # Check if user exists
    user = session.exec(
        select(User).where(User.mobile_number == normalized_number)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Send OTP via 2Factor API (generates and sends automatically)
    otp_service = get_otp_service()
    sms_sent, session_id = otp_service.send_otp(normalized_number)
    
    if not sms_sent or not session_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP. Please try again."
        )
    
    # Save OTP session to database
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expiry_minutes)
    otp_record = OTP(
        mobile_number=normalized_number,
        session_id=session_id,
        expires_at=expires_at,
        is_used=False
    )
    
    session.add(otp_record)
    session.commit()
    
    return OTPResponse(
        message="New OTP sent successfully",
        mobile_number=normalized_number,
        expires_in_minutes=settings.otp_expiry_minutes
    )
