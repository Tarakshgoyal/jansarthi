"""JWT authentication service"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlmodel import Session, select

from app.database import get_session
from app.models.issue import User
from app.schemas.auth import TokenData
from app.settings.config import get_settings

settings = get_settings()
security = HTTPBearer()


class AuthService:
    """Service for JWT token management and authentication"""

    @staticmethod
    def create_access_token(user_id: int, mobile_number: str) -> str:
        """
        Create JWT access token
        
        Args:
            user_id: User's ID
            mobile_number: User's mobile number
            
        Returns:
            str: Encoded JWT token
        """
        expires_delta = timedelta(minutes=settings.jwt_access_token_expire_minutes)
        expire = datetime.utcnow() + expires_delta
        
        to_encode = {
            "user_id": user_id,
            "mobile_number": mobile_number,
            "token_type": "access",
            "exp": expire,
            "iat": datetime.utcnow()
        }
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm
        )
        return encoded_jwt

    @staticmethod
    def create_refresh_token(user_id: int, mobile_number: str) -> str:
        """
        Create JWT refresh token
        
        Args:
            user_id: User's ID
            mobile_number: User's mobile number
            
        Returns:
            str: Encoded JWT token
        """
        expires_delta = timedelta(days=settings.jwt_refresh_token_expire_days)
        expire = datetime.utcnow() + expires_delta
        
        to_encode = {
            "user_id": user_id,
            "mobile_number": mobile_number,
            "token_type": "refresh",
            "exp": expire,
            "iat": datetime.utcnow()
        }
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm
        )
        return encoded_jwt

    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> TokenData:
        """
        Verify and decode JWT token
        
        Args:
            token: JWT token string
            token_type: Expected token type ("access" or "refresh")
            
        Returns:
            TokenData: Decoded token data
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm]
            )
            
            user_id: int = int(str(payload.get("user_id")))
            mobile_number: str = str(payload.get("mobile_number"))
            token_type_from_payload: str = str(payload.get("token_type"))
            
            if not user_id or len(mobile_number) <= 0:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            if token_type_from_payload != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid token type. Expected {token_type}",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            return TokenData(
                user_id=user_id,
                mobile_number=mobile_number,
                token_type=token_type_from_payload
            )
            
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Could not validate credentials: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    @staticmethod
    def create_token_pair(user_id: int, mobile_number: str) -> dict:
        """
        Create access and refresh token pair
        
        Args:
            user_id: User's ID
            mobile_number: User's mobile number
            
        Returns:
            dict: Dictionary with access_token and refresh_token
        """
        access_token = AuthService.create_access_token(user_id, mobile_number)
        refresh_token = AuthService.create_refresh_token(user_id, mobile_number)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.jwt_access_token_expire_minutes * 60  # in seconds
        }


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    """
    Dependency to get current authenticated user
    
    Args:
        credentials: HTTP Bearer token
        session: Database session
        
    Returns:
        User: Current authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    
    # Verify token
    token_data = AuthService.verify_token(token, token_type="access")
    
    # Get user from database
    user = session.get(User, token_data.user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get current active user
    
    Args:
        current_user: Current user from get_current_user
        
    Returns:
        User: Current active user
        
    Raises:
        HTTPException: If user is not verified
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your account first"
        )
    
    return current_user


# Optional: Get user from token but don't require it
async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    session: Session = Depends(get_session)
) -> Optional[User]:
    """
    Dependency to optionally get authenticated user (doesn't fail if no token)
    
    Args:
        credentials: Optional HTTP Bearer token
        session: Database session
        
    Returns:
        Optional[User]: User if authenticated, None otherwise
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        token_data = AuthService.verify_token(token, token_type="access")
        user = session.get(User, token_data.user_id)
        return user if user and user.is_active else None
    except:
        return None
