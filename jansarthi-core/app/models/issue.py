from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Column, DateTime, Enum as SQLAEnum, func
from sqlmodel import Field, Relationship, SQLModel


class IssueType(str, Enum):
    """Enum for different types of issues"""

    WATER = "water"
    ELECTRICITY = "electricity"
    ROAD = "road"
    GARBAGE = "garbage"


class IssueStatus(str, Enum):
    """Enum for issue status - New Flow:
    1. REPORTED - User reports issue
    2. ASSIGNED - Auto-assigned to Representative of the locality
    3. REPRESENTATIVE_ACKNOWLEDGED - Representative confirms problem exists
    4. PWD_WORKING - PWD workers are working on the issue
    5. PWD_COMPLETED - PWD workers have finished the work
    6. REPRESENTATIVE_REVIEWED - Representative has reviewed and confirmed fix
    """

    REPORTED = "reported"
    ASSIGNED = "assigned"  # Auto-assigned to Representative
    REPRESENTATIVE_ACKNOWLEDGED = "representative_acknowledged"  # Representative confirmed issue exists
    PWD_WORKING = "pwd_working"  # PWD workers started work
    PWD_COMPLETED = "pwd_completed"  # PWD workers finished work
    REPRESENTATIVE_REVIEWED = "representative_reviewed"  # Representative reviewed and closed


class UserRole(str, Enum):
    """Enum for user roles"""
    
    USER = "user"  # Normal citizen who reports issues
    REPRESENTATIVE = "representative"  # Local head (Parshad for ward, Pradhan for village)
    PWD_WORKER = "pwd_worker"  # PWD official who works on issues
    ADMIN = "admin"  # Administrator who manages system


class LocalityType(str, Enum):
    """Type of locality - determines if head is called Parshad or Pradhan"""
    
    WARD = "ward"  # Urban area - head is called Parshad
    VILLAGE = "village"  # Rural area - head is called Pradhan


class Locality(SQLModel, table=True):
    """Locality model - can be a Ward (urban) or Village (rural)"""

    __tablename__ = "localities"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200, index=True)
    
    # Type determines if head is Parshad (ward) or Pradhan (village)
    type: LocalityType = Field(
        sa_column=Column(
            SQLAEnum(LocalityType, values_callable=lambda x: [e.value for e in x]),
            nullable=False,
            index=True
        )
    )
    
    # Status
    is_active: bool = Field(default=True)

    # Timestamps (with Python defaults for type safety)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True), server_default=func.now(), nullable=False
        )
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        )
    )

    # Relationships
    issues: list["Issue"] = Relationship(back_populates="locality")
    users: list["User"] = Relationship(back_populates="locality")


class Issue(SQLModel, table=True):
    """Main issue/report model"""

    __tablename__ = "issues"

    id: Optional[int] = Field(default=None, primary_key=True)
    issue_type: IssueType = Field(
        sa_column=Column(
            SQLAEnum(IssueType, values_callable=lambda x: [e.value for e in x]),
            nullable=False,
            index=True
        )
    )
    description: str = Field(min_length=10, max_length=2000)

    # Location data
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    
    # Locality (ward or village) - foreign key to localities table
    locality_id: Optional[int] = Field(default=None, foreign_key="localities.id", index=True)

    # Status
    status: IssueStatus = Field(
        default=IssueStatus.REPORTED,
        sa_column=Column(
            SQLAEnum(IssueStatus, values_callable=lambda x: [e.value for e in x]),
            nullable=False,
            index=True,
            default=IssueStatus.REPORTED
        )
    )

    # User ID (for future auth implementation)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    
    # Assigned Parshad (set by PWD worker)
    assigned_parshad_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    
    # Assignment notes from PWD worker
    assignment_notes: Optional[str] = Field(default=None, max_length=1000)
    
    # Parshad's progress notes
    progress_notes: Optional[str] = Field(default=None, max_length=2000)
    
    # PWD Worker completion data
    completion_description: Optional[str] = Field(default=None, max_length=2000)
    completion_photo_url: Optional[str] = Field(default=None, max_length=500)
    completed_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    completed_by_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)

    # Timestamps
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), server_default=func.now(), nullable=False
        )
    )
    updated_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        )
    )

    # Relationships
    photos: list["IssuePhoto"] = Relationship(
        back_populates="issue", cascade_delete=True
    )
    locality: Optional["Locality"] = Relationship(back_populates="issues")


class IssuePhoto(SQLModel, table=True):
    """Model for issue photos"""

    __tablename__ = "issue_photos"

    id: Optional[int] = Field(default=None, primary_key=True)
    issue_id: int = Field(foreign_key="issues.id", index=True)

    # MinIO/S3 path
    photo_url: str = Field(max_length=500)

    # Original filename
    filename: str = Field(max_length=255)

    # File metadata
    file_size: int  # in bytes
    content_type: str = Field(default="image/jpeg")

    # Timestamps
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), server_default=func.now(), nullable=False
        )
    )

    # Relationships
    issue: Optional[Issue] = Relationship(back_populates="photos")


class User(SQLModel, table=True):
    """User model for authentication"""

    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255)
    mobile_number: str = Field(unique=True, index=True, max_length=15)
    
    # Role-based access
    role: UserRole = Field(
        default=UserRole.USER,
        sa_column=Column(
            SQLAEnum(UserRole, values_callable=lambda x: [e.value for e in x]),
            nullable=False,
            index=True,
            default=UserRole.USER
        )
    )
    
    # Authentication
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    
    # Locality assignment (for Representatives - foreign key to localities table)
    locality_id: Optional[int] = Field(default=None, foreign_key="localities.id", index=True)

    # Timestamps
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), server_default=func.now(), nullable=False
        )
    )
    updated_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        )
    )

    # Relationships
    locality: Optional["Locality"] = Relationship(back_populates="users")


class OTP(SQLModel, table=True):
    """OTP model for phone verification"""
    
    __tablename__ = "otps"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    mobile_number: str = Field(index=True, max_length=15)
    session_id: str = Field(max_length=100)  # 2Factor.in session ID for OTP verification
    
    # OTP metadata
    is_used: bool = Field(default=False)
    attempt_count: int = Field(default=0)
    
    # Timestamps
    expires_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), server_default=func.now(), nullable=False
        )
    )
    used_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )
