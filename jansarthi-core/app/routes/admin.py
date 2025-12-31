"""Administrator API routes - for managing localities, representatives, and PWD workers"""

import math
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlmodel import Session, func, select

from app.database import get_session
from app.models.issue import Issue, Locality, LocalityType, User, UserRole
from app.services.auth import get_current_active_user
from app.settings.config import get_settings

settings = get_settings()
admin_router = APIRouter(prefix="/api/admin", tags=["Administrator"])


# ==================== Schemas ====================

class CreateLocalityRequest(BaseModel):
    """Request to create a new locality (ward/village)"""
    name: str = Field(..., min_length=1, max_length=200)
    type: LocalityType = Field(..., description="Type of locality (ward or village)")


class LocalityResponse(BaseModel):
    """Response for locality"""
    id: int
    name: str
    type: LocalityType
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    representative_count: int = 0
    issue_count: int = 0

    class Config:
        from_attributes = True


class LocalityListResponse(BaseModel):
    """Paginated list of localities"""
    items: list[LocalityResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class UpdateLocalityRequest(BaseModel):
    """Request to update a locality"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    is_active: Optional[bool] = None


class CreateUserRequest(BaseModel):
    """Request to create a new user with a specific role"""
    name: str = Field(..., min_length=1, max_length=255)
    mobile_number: str = Field(
        ..., 
        min_length=10, 
        max_length=15,
        pattern=r"^\+?[1-9]\d{9,14}$",
        description="Mobile number with country code (e.g., +919876543210)"
    )
    role: UserRole = Field(..., description="User role (representative, pwd_worker, admin)")
    locality_id: Optional[int] = Field(None, description="Locality ID (required for representatives)")


class AdminUserResponse(BaseModel):
    """Admin view of user details"""
    id: int
    name: str
    mobile_number: str
    role: UserRole
    is_active: bool
    is_verified: bool
    locality_id: Optional[int] = None
    locality_name: Optional[str] = None
    locality_type: Optional[LocalityType] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    total_reports: int = 0
    assigned_issues: int = 0

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Paginated list of users"""
    items: list[AdminUserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class UpdateUserRequest(BaseModel):
    """Request to update a user"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    locality_id: Optional[int] = None


# ==================== Dependencies ====================

async def get_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Dependency to verify user is an Administrator
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required"
        )
    return current_user


# ==================== Locality Management ====================

@admin_router.post(
    "/localities",
    response_model=LocalityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new locality (ward/village)",
)
async def create_locality(
    locality_data: CreateLocalityRequest,
    admin_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """
    Create a new locality (ward or village).
    
    **Admin Only**: Only administrators can create localities.
    
    - **name**: Name of the locality (e.g., "Ward 5" or "Rajpur Village")
    - **type**: Type of locality (ward or village)
    """
    # Check if locality with same name and type exists
    existing = session.exec(
        select(Locality).where(
            Locality.name == locality_data.name,
            Locality.type == locality_data.type
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A {locality_data.type.value} with this name already exists"
        )
    
    new_locality = Locality(
        name=locality_data.name,
        type=locality_data.type,
        is_active=True,
    )
    
    session.add(new_locality)
    session.commit()
    session.refresh(new_locality)
    
    return LocalityResponse(
        id=new_locality.id,
        name=new_locality.name,
        type=new_locality.type,
        is_active=new_locality.is_active,
        created_at=new_locality.created_at,
        updated_at=new_locality.updated_at,
        representative_count=0,
        issue_count=0,
    )


@admin_router.get(
    "/localities",
    response_model=LocalityListResponse,
    summary="Get all localities",
)
async def get_localities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    locality_type: Optional[LocalityType] = Query(None, alias="type", description="Filter by type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name"),
    admin_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """
    Get paginated list of all localities.
    """
    query = select(Locality)
    count_query = select(func.count(Locality.id))
    
    if locality_type:
        query = query.where(Locality.type == locality_type)
        count_query = count_query.where(Locality.type == locality_type)
    
    if is_active is not None:
        query = query.where(Locality.is_active == is_active)
        count_query = count_query.where(Locality.is_active == is_active)
    
    if search:
        query = query.where(Locality.name.contains(search))
        count_query = count_query.where(Locality.name.contains(search))
    
    total = session.exec(count_query).one()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Locality.name)
    
    localities = session.exec(query).all()
    
    items = []
    for loc in localities:
        rep_count = session.exec(
            select(func.count(User.id)).where(
                User.locality_id == loc.id,
                User.role == UserRole.REPRESENTATIVE
            )
        ).one()
        
        issue_count = session.exec(
            select(func.count(Issue.id)).where(Issue.locality_id == loc.id)
        ).one()
        
        items.append(LocalityResponse(
            id=loc.id,
            name=loc.name,
            type=loc.type,
            is_active=loc.is_active,
            created_at=loc.created_at,
            updated_at=loc.updated_at,
            representative_count=rep_count,
            issue_count=issue_count,
        ))
    
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    return LocalityListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@admin_router.get(
    "/localities/{locality_id}",
    response_model=LocalityResponse,
    summary="Get locality details",
)
async def get_locality(
    locality_id: int,
    admin_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """
    Get details of a specific locality.
    """
    locality = session.get(Locality, locality_id)
    
    if not locality:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Locality not found"
        )
    
    rep_count = session.exec(
        select(func.count(User.id)).where(
            User.locality_id == locality.id,
            User.role == UserRole.REPRESENTATIVE
        )
    ).one()
    
    issue_count = session.exec(
        select(func.count(Issue.id)).where(Issue.locality_id == locality.id)
    ).one()
    
    return LocalityResponse(
        id=locality.id,
        name=locality.name,
        type=locality.type,
        is_active=locality.is_active,
        created_at=locality.created_at,
        updated_at=locality.updated_at,
        representative_count=rep_count,
        issue_count=issue_count,
    )


@admin_router.patch(
    "/localities/{locality_id}",
    response_model=LocalityResponse,
    summary="Update a locality",
)
async def update_locality(
    locality_id: int,
    update_data: UpdateLocalityRequest,
    admin_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """
    Update a locality's name or status.
    """
    locality = session.get(Locality, locality_id)
    
    if not locality:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Locality not found"
        )
    
    if update_data.name is not None:
        # Check for duplicate name
        existing = session.exec(
            select(Locality).where(
                Locality.name == update_data.name,
                Locality.type == locality.type,
                Locality.id != locality_id
            )
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A {locality.type.value} with this name already exists"
            )
        
        locality.name = update_data.name
    
    if update_data.is_active is not None:
        locality.is_active = update_data.is_active
    
    session.add(locality)
    session.commit()
    session.refresh(locality)
    
    rep_count = session.exec(
        select(func.count(User.id)).where(
            User.locality_id == locality.id,
            User.role == UserRole.REPRESENTATIVE
        )
    ).one()
    
    issue_count = session.exec(
        select(func.count(Issue.id)).where(Issue.locality_id == locality.id)
    ).one()
    
    return LocalityResponse(
        id=locality.id,
        name=locality.name,
        type=locality.type,
        is_active=locality.is_active,
        created_at=locality.created_at,
        updated_at=locality.updated_at,
        representative_count=rep_count,
        issue_count=issue_count,
    )


@admin_router.delete(
    "/localities/{locality_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a locality",
)
async def delete_locality(
    locality_id: int,
    admin_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """
    Delete a locality. Will fail if there are issues or users assigned to it.
    """
    locality = session.get(Locality, locality_id)
    
    if not locality:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Locality not found"
        )
    
    # Check if there are issues in this locality
    issue_count = session.exec(
        select(func.count(Issue.id)).where(Issue.locality_id == locality_id)
    ).one()
    
    if issue_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete locality with {issue_count} issues. Deactivate it instead."
        )
    
    # Check if there are users assigned to this locality
    user_count = session.exec(
        select(func.count(User.id)).where(User.locality_id == locality_id)
    ).one()
    
    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete locality with {user_count} assigned users. Reassign them first."
        )
    
    session.delete(locality)
    session.commit()


# ==================== User Management ====================

@admin_router.post(
    "/users",
    response_model=AdminUserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user (Representative, PWD Worker, or Admin)",
)
async def create_user(
    user_data: CreateUserRequest,
    admin_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """
    Create a new user with a specific role.
    
    **Admin Only**: Only administrators can create users with elevated roles.
    
    - **name**: User's full name
    - **mobile_number**: Mobile number (will be used for login)
    - **role**: User role (representative, pwd_worker, admin)
    - **locality_id**: Locality ID (required for representatives)
    """
    from app.services.twilio import normalize_phone_number
    
    # Cannot create regular users via admin API
    if user_data.role == UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Regular users register themselves. Use this API for representatives, PWD workers, or admins."
        )
    
    # Representatives must have a locality
    if user_data.role == UserRole.REPRESENTATIVE and user_data.locality_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Representatives must be assigned to a locality"
        )
    
    # Verify locality exists if provided
    if user_data.locality_id is not None:
        locality = session.get(Locality, user_data.locality_id)
        if not locality:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Locality not found"
            )
        if not locality.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot assign user to inactive locality"
            )
    
    # Normalize phone number
    normalized_number = normalize_phone_number(user_data.mobile_number)
    
    # Check if user already exists
    existing_user = session.exec(
        select(User).where(User.mobile_number == normalized_number)
    ).first()
    
    if existing_user:
        if existing_user.role == user_data.role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A {user_data.role.value} with this mobile number already exists"
            )
        else:
            # Upgrade existing user
            existing_user.role = user_data.role
            existing_user.is_verified = True
            if user_data.locality_id is not None:
                existing_user.locality_id = user_data.locality_id
            
            session.add(existing_user)
            session.commit()
            session.refresh(existing_user)
            
            return _build_user_response(existing_user, session)
    
    # Create new user
    new_user = User(
        name=user_data.name,
        mobile_number=normalized_number,
        role=user_data.role,
        is_active=True,
        is_verified=True,  # Pre-verified by admin
        locality_id=user_data.locality_id,
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    return _build_user_response(new_user, session)


@admin_router.get(
    "/users",
    response_model=UserListResponse,
    summary="Get all users",
)
async def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    locality_id: Optional[int] = Query(None, description="Filter by locality"),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None, description="Search by name or mobile"),
    admin_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """
    Get paginated list of all users.
    """
    query = select(User)
    count_query = select(func.count(User.id))
    
    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)
    
    if locality_id is not None:
        query = query.where(User.locality_id == locality_id)
        count_query = count_query.where(User.locality_id == locality_id)
    
    if is_active is not None:
        query = query.where(User.is_active == is_active)
        count_query = count_query.where(User.is_active == is_active)
    
    if search:
        query = query.where(
            (User.name.contains(search)) | (User.mobile_number.contains(search))
        )
        count_query = count_query.where(
            (User.name.contains(search)) | (User.mobile_number.contains(search))
        )
    
    total = session.exec(count_query).one()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(User.created_at.desc())
    
    users = session.exec(query).all()
    items = [_build_user_response(user, session) for user in users]
    
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    return UserListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@admin_router.get(
    "/users/{user_id}",
    response_model=AdminUserResponse,
    summary="Get user details",
)
async def get_user(
    user_id: int,
    admin_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """
    Get details of a specific user.
    """
    user = session.get(User, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return _build_user_response(user, session)


@admin_router.patch(
    "/users/{user_id}",
    response_model=AdminUserResponse,
    summary="Update user details",
)
async def update_user(
    user_id: int,
    update_data: UpdateUserRequest,
    admin_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """
    Update user role, status, or other details.
    """
    user = session.get(User, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Cannot demote yourself
    if user.id == admin_user.id and update_data.role is not None and update_data.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    # Verify locality exists if being updated
    if update_data.locality_id is not None:
        locality = session.get(Locality, update_data.locality_id)
        if not locality:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Locality not found"
            )
    
    if update_data.name is not None:
        user.name = update_data.name
    
    if update_data.role is not None:
        user.role = update_data.role
    
    if update_data.is_active is not None:
        user.is_active = update_data.is_active
    
    if update_data.locality_id is not None:
        user.locality_id = update_data.locality_id
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return _build_user_response(user, session)


@admin_router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate a user",
)
async def deactivate_user(
    user_id: int,
    admin_user: User = Depends(get_admin_user),
    session: Session = Depends(get_session),
):
    """
    Deactivate a user (soft delete).
    """
    user = session.get(User, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself"
        )
    
    user.is_active = False
    session.add(user)
    session.commit()


# ==================== Helper Functions ====================

def _build_user_response(user: User, session: Session) -> AdminUserResponse:
    """Build AdminUserResponse with related data"""
    locality_name = None
    locality_type = None
    
    if user.locality_id:
        locality = session.get(Locality, user.locality_id)
        if locality:
            locality_name = locality.name
            locality_type = locality.type
    
    report_count = session.exec(
        select(func.count(Issue.id)).where(Issue.user_id == user.id)
    ).one()
    
    assigned_count = 0
    if user.role == UserRole.REPRESENTATIVE:
        assigned_count = session.exec(
            select(func.count(Issue.id)).where(Issue.assigned_parshad_id == user.id)
        ).one()
    
    return AdminUserResponse(
        id=user.id,
        name=user.name,
        mobile_number=user.mobile_number,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        locality_id=user.locality_id,
        locality_name=locality_name,
        locality_type=locality_type,
        created_at=user.created_at,
        updated_at=user.updated_at,
        total_reports=report_count,
        assigned_issues=assigned_count,
    )
