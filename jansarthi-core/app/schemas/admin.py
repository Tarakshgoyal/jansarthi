"""Schemas for admin operations - Parshad and PWD Worker"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.issue import IssueStatus, IssueType, UserRole


# ==================== Common Schemas ====================

class IssueCountByType(BaseModel):
    """Count of issues by type"""
    water: int = 0
    electricity: int = 0
    road: int = 0
    garbage: int = 0


class IssueCountByStatus(BaseModel):
    """Count of issues by status"""
    reported: int = 0
    assigned: int = 0
    representative_acknowledged: int = 0
    pwd_working: int = 0
    pwd_completed: int = 0
    representative_reviewed: int = 0
    # Legacy support
    parshad_check: int = 0
    started_working: int = 0
    finished_work: int = 0


# ==================== User/Parshad Schemas ====================

class ParshadInfo(BaseModel):
    """Basic Representative info for issue assignment"""
    id: int
    name: str
    mobile_number: str
    locality_id: Optional[int] = None
    locality_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class ParshadListResponse(BaseModel):
    """List of available Parshads"""
    items: list[ParshadInfo]
    total: int


class UserInfo(BaseModel):
    """Basic user info who reported issue"""
    id: int
    name: str
    mobile_number: str
    
    class Config:
        from_attributes = True


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
    created_at: datetime
    updated_at: datetime
    total_reports: int = 0
    assigned_issues: int = 0  # For Representatives

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Paginated list of users"""
    items: list[AdminUserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class UserRoleUpdate(BaseModel):
    """Update user role and details"""
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    locality_id: Optional[int] = Field(None, description="Locality ID for Representative assignment")


# ==================== Issue Schemas for Admin ====================

class AdminIssueResponse(BaseModel):
    """Admin view of issue with full details"""
    id: int
    issue_type: IssueType
    description: str
    latitude: float
    longitude: float
    status: IssueStatus
    
    # Reporter info
    user_id: Optional[int]
    reporter: Optional[UserInfo] = None
    
    # Assignment info
    assigned_parshad_id: Optional[int] = None
    assigned_parshad: Optional[ParshadInfo] = None
    assignment_notes: Optional[str] = None
    
    # Progress
    progress_notes: Optional[str] = None
    
    # PWD completion data
    completion_description: Optional[str] = None
    completion_photo_url: Optional[str] = None
    completed_at: Optional[datetime] = None
    completed_by_id: Optional[int] = None
    completed_by_name: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    photo_count: int = 0

    class Config:
        from_attributes = True


class AdminIssueListResponse(BaseModel):
    """Paginated list of issues for admin"""
    items: list[AdminIssueResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ==================== PWD Worker Schemas ====================

class PWDDashboardStats(BaseModel):
    """Dashboard statistics for PWD Worker"""
    total_issues: int
    unassigned_issues: int  # Issues that need Parshad assignment
    assigned_issues: int
    in_progress_issues: int
    completed_issues: int
    total_parshads: int
    active_parshads: int  # Parshads with ongoing work
    issues_by_type: IssueCountByType
    issues_by_status: IssueCountByStatus
    issues_today: int
    issues_this_week: int


class CreateParshadRequest(BaseModel):
    """Request to create a new Representative account"""
    name: str = Field(..., min_length=1, max_length=255)
    mobile_number: str = Field(
        ..., 
        min_length=10, 
        max_length=15,
        pattern=r"^\+?[1-9]\d{9,14}$",
        description="Mobile number with country code (e.g., +919876543210)"
    )
    locality_id: Optional[int] = Field(None, description="Locality ID this Representative is responsible for")


class AssignParshadRequest(BaseModel):
    """Request to assign a Parshad to an issue"""
    parshad_id: int
    assignment_notes: Optional[str] = Field(None, max_length=1000)


class PWDStatusUpdate(BaseModel):
    """PWD can reassign or add notes"""
    assigned_parshad_id: Optional[int] = None
    assignment_notes: Optional[str] = Field(None, max_length=1000)


# ==================== Parshad Schemas ====================

class ParshadDashboardStats(BaseModel):
    """Dashboard statistics for Parshad"""
    total_assigned: int
    pending_acknowledgement: int  # Status = ASSIGNED
    in_progress: int  # Status = REPRESENTATIVE_ACKNOWLEDGED or PWD_WORKING
    pending_review: int = 0  # Status = PWD_COMPLETED (needs Parshad review)
    completed: int  # Status = REPRESENTATIVE_REVIEWED
    issues_by_type: IssueCountByType


class ParshadStatusUpdate(BaseModel):
    """Parshad updates issue status and progress"""
    status: IssueStatus = Field(
        ...,
        description="New status (parshad_check, started_working, finished_work)"
    )
    progress_notes: Optional[str] = Field(None, max_length=2000)
