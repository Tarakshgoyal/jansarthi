from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.issue import IssueStatus, IssueType


class IssuePhotoResponse(BaseModel):
    """Schema for issue photo response"""

    id: int
    photo_url: str
    filename: str
    file_size: int
    content_type: str
    created_at: datetime

    model_config = {"from_attributes": True}


class IssueCreate(BaseModel):
    """Schema for creating a new issue"""

    issue_type: IssueType = Field(..., description="Type of issue being reported")
    description: str = Field(
        ..., min_length=10, max_length=2000, description="Detailed description"
    )
    latitude: float = Field(..., ge=-90, le=90, description="Location latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Location longitude")
    user_id: Optional[int] = Field(None, description="User ID (for future auth)")


class IssueResponse(BaseModel):
    """Schema for issue response"""

    id: int
    issue_type: IssueType
    description: str
    latitude: float
    longitude: float
    locality_id: Optional[int] = None
    locality_name: Optional[str] = None
    locality_type: Optional[str] = None
    status: IssueStatus
    user_id: Optional[int]
    assigned_parshad_id: Optional[int] = None
    assignment_message: Optional[str] = None
    
    # PWD completion data
    completion_description: Optional[str] = None
    completion_photo_url: Optional[str] = None
    completed_at: Optional[datetime] = None
    completed_by_id: Optional[int] = None
    
    created_at: datetime
    updated_at: datetime
    photos: list[IssuePhotoResponse] = []

    model_config = {"from_attributes": True}


class IssueListResponse(BaseModel):
    """Schema for paginated issue list response"""

    items: list[IssueResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class IssueMapResponse(BaseModel):
    """Minimal schema for map view (performance optimized)"""

    id: int
    issue_type: IssueType
    latitude: float
    longitude: float
    status: IssueStatus

    model_config = {"from_attributes": True}


class IssueStatusUpdate(BaseModel):
    """Schema for updating issue status"""

    status: IssueStatus


class IssueUpdate(BaseModel):
    """Schema for updating an issue"""

    description: Optional[str] = Field(None, min_length=10, max_length=2000)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class PhotoUploadResponse(BaseModel):
    """Schema for photo upload response"""

    photo_id: int
    photo_url: str
    filename: str
    file_size: int
