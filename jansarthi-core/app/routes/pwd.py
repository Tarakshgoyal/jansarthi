"""PWD Worker API routes - for assigning Parshads and monitoring issues"""

import math
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, func, select

from app.database import get_session
from app.models.issue import Issue, IssueStatus, IssueType, User, UserRole
from app.schemas.admin import (
    AdminIssueListResponse,
    AdminIssueResponse,
    AdminUserResponse,
    AssignParshadRequest,
    CreateParshadRequest,
    IssueCountByStatus,
    IssueCountByType,
    ParshadInfo,
    ParshadListResponse,
    PWDDashboardStats,
    PWDStatusUpdate,
    UserInfo,
    UserListResponse,
    UserRoleUpdate,
)
from app.services.auth import get_current_active_user
from app.services.storage import get_storage_service
from app.settings.config import get_settings

settings = get_settings()
pwd_router = APIRouter(prefix="/api/pwd", tags=["PWD Worker"])


async def get_pwd_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Dependency to verify user is a PWD Worker
    """
    if current_user.role != UserRole.PWD_WORKER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="PWD Worker privileges required"
        )
    return current_user


def build_issue_response(issue: Issue, session: Session) -> AdminIssueResponse:
    """Helper to build AdminIssueResponse with related data"""
    reporter = None
    if issue.user_id:
        user = session.get(User, issue.user_id)
        if user:
            reporter = UserInfo(id=user.id, name=user.name, mobile_number=user.mobile_number)
    
    assigned_parshad = None
    if issue.assigned_parshad_id:
        parshad = session.get(User, issue.assigned_parshad_id)
        if parshad:
            assigned_parshad = ParshadInfo(
                id=parshad.id,
                name=parshad.name,
                mobile_number=parshad.mobile_number,
                village_name=parshad.village_name,
                ward_id=parshad.ward_id,
                latitude=parshad.latitude,
                longitude=parshad.longitude,
            )
    
    return AdminIssueResponse(
        id=issue.id,
        issue_type=issue.issue_type,
        description=issue.description,
        latitude=issue.latitude,
        longitude=issue.longitude,
        status=issue.status,
        user_id=issue.user_id,
        reporter=reporter,
        assigned_parshad_id=issue.assigned_parshad_id,
        assigned_parshad=assigned_parshad,
        assignment_notes=issue.assignment_notes,
        progress_notes=issue.progress_notes,
        created_at=issue.created_at,
        updated_at=issue.updated_at,
        photo_count=len(issue.photos),
    )


# ==================== Dashboard ====================

@pwd_router.get(
    "/dashboard",
    response_model=PWDDashboardStats,
    summary="Get PWD Worker dashboard statistics",
)
async def get_pwd_dashboard(
    pwd_user: User = Depends(get_pwd_user),
    session: Session = Depends(get_session),
):
    """
    Get comprehensive dashboard statistics for PWD Worker.
    
    Shows overview of all issues, assignment status, and Parshad activity.
    """
    # Total issues
    total_issues = session.exec(select(func.count(Issue.id))).one()
    
    # Unassigned issues (reported but no parshad assigned)
    unassigned_issues = session.exec(
        select(func.count(Issue.id)).where(
            Issue.status == IssueStatus.REPORTED,
            Issue.assigned_parshad_id == None
        )
    ).one()
    
    # Assigned issues (has parshad but not yet acknowledged)
    assigned_issues = session.exec(
        select(func.count(Issue.id)).where(Issue.status == IssueStatus.ASSIGNED)
    ).one()
    
    # In progress (parshad_acknowledged or pwd_working)
    in_progress_issues = session.exec(
        select(func.count(Issue.id)).where(
            Issue.status.in_([
                IssueStatus.PARSHAD_ACKNOWLEDGED, 
                IssueStatus.PWD_WORKING,
                IssueStatus.PARSHAD_CHECK,  # Legacy
                IssueStatus.STARTED_WORKING  # Legacy
            ])
        )
    ).one()
    
    # Completed (parshad reviewed/closed)
    completed_issues = session.exec(
        select(func.count(Issue.id)).where(
            Issue.status.in_([
                IssueStatus.PARSHAD_REVIEWED,
                IssueStatus.FINISHED_WORK  # Legacy
            ])
        )
    ).one()
    
    # Total Parshads
    total_parshads = session.exec(
        select(func.count(User.id)).where(
            User.role == UserRole.PARSHAD,
            User.is_active == True
        )
    ).one()
    
    # Active Parshads (with ongoing work)
    active_parshads = session.exec(
        select(func.count(func.distinct(Issue.assigned_parshad_id))).where(
            Issue.status.in_([IssueStatus.ASSIGNED, IssueStatus.PARSHAD_CHECK, IssueStatus.STARTED_WORKING])
        )
    ).one()
    
    # Issues by type
    issues_by_type = IssueCountByType()
    for issue_type in IssueType:
        count = session.exec(
            select(func.count(Issue.id)).where(Issue.issue_type == issue_type)
        ).one()
        setattr(issues_by_type, issue_type.value, count)
    
    # Issues by status
    issues_by_status = IssueCountByStatus()
    for issue_status in IssueStatus:
        count = session.exec(
            select(func.count(Issue.id)).where(Issue.status == issue_status)
        ).one()
        setattr(issues_by_status, issue_status.value, count)
    
    # Time-based counts
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    
    issues_today = session.exec(
        select(func.count(Issue.id)).where(Issue.created_at >= today_start)
    ).one()
    
    issues_this_week = session.exec(
        select(func.count(Issue.id)).where(Issue.created_at >= week_start)
    ).one()
    
    return PWDDashboardStats(
        total_issues=total_issues,
        unassigned_issues=unassigned_issues,
        assigned_issues=assigned_issues,
        in_progress_issues=in_progress_issues,
        completed_issues=completed_issues,
        total_parshads=total_parshads,
        active_parshads=active_parshads,
        issues_by_type=issues_by_type,
        issues_by_status=issues_by_status,
        issues_today=issues_today,
        issues_this_week=issues_this_week,
    )


# ==================== Issue Management ====================

@pwd_router.get(
    "/issues",
    response_model=AdminIssueListResponse,
    summary="Get all issues",
)
async def get_all_issues(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    issue_type: Optional[IssueType] = Query(None, description="Filter by issue type"),
    status_filter: Optional[IssueStatus] = Query(None, alias="status", description="Filter by status"),
    assigned: Optional[bool] = Query(None, description="Filter by assignment status (true=assigned, false=unassigned)"),
    parshad_id: Optional[int] = Query(None, description="Filter by assigned Parshad"),
    search: Optional[str] = Query(None, description="Search in description"),
    pwd_user: User = Depends(get_pwd_user),
    session: Session = Depends(get_session),
):
    """
    Get paginated list of all issues with filtering options.
    
    **PWD Worker Only**: View all reported issues and their assignment status.
    """
    # Build query
    query = select(Issue)
    count_query = select(func.count(Issue.id))
    
    # Apply filters
    if issue_type:
        query = query.where(Issue.issue_type == issue_type)
        count_query = count_query.where(Issue.issue_type == issue_type)
    
    if status_filter:
        query = query.where(Issue.status == status_filter)
        count_query = count_query.where(Issue.status == status_filter)
    
    if assigned is not None:
        if assigned:
            query = query.where(Issue.assigned_parshad_id != None)
            count_query = count_query.where(Issue.assigned_parshad_id != None)
        else:
            query = query.where(Issue.assigned_parshad_id == None)
            count_query = count_query.where(Issue.assigned_parshad_id == None)
    
    if parshad_id:
        query = query.where(Issue.assigned_parshad_id == parshad_id)
        count_query = count_query.where(Issue.assigned_parshad_id == parshad_id)
    
    if search:
        query = query.where(Issue.description.contains(search))
        count_query = count_query.where(Issue.description.contains(search))
    
    # Get total count
    total = session.exec(count_query).one()
    
    # Apply pagination and sorting
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Issue.created_at.desc())
    
    issues = session.exec(query).all()
    
    # Build response
    items = [build_issue_response(issue, session) for issue in issues]
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    return AdminIssueListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@pwd_router.get(
    "/issues/{issue_id}",
    response_model=AdminIssueResponse,
    summary="Get issue details",
)
async def get_issue_detail(
    issue_id: int,
    pwd_user: User = Depends(get_pwd_user),
    session: Session = Depends(get_session),
):
    """
    Get detailed information about a specific issue.
    """
    issue = session.get(Issue, issue_id)
    
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue with id {issue_id} not found"
        )
    
    return build_issue_response(issue, session)


# ==================== PWD Worker Issue Actions ====================

@pwd_router.get(
    "/my-issues",
    response_model=AdminIssueListResponse,
    summary="Get issues for PWD workers to work on",
)
async def get_pwd_worker_issues(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    issue_type: Optional[IssueType] = Query(None, description="Filter by issue type"),
    filter_type: Optional[str] = Query(None, description="Filter: pending, in_progress, completed"),
    pwd_user: User = Depends(get_pwd_user),
    session: Session = Depends(get_session),
):
    """
    Get issues that are ready for PWD workers to work on.
    
    These are issues where Parshad has acknowledged the problem.
    """
    query = select(Issue)
    count_query = select(func.count(Issue.id))
    
    # Filter by type
    if filter_type == "pending":
        # Issues acknowledged by Parshad, waiting for PWD work
        query = query.where(
            Issue.status.in_([IssueStatus.PARSHAD_ACKNOWLEDGED, IssueStatus.PARSHAD_CHECK])
        )
        count_query = count_query.where(
            Issue.status.in_([IssueStatus.PARSHAD_ACKNOWLEDGED, IssueStatus.PARSHAD_CHECK])
        )
    elif filter_type == "in_progress":
        # Issues PWD is working on
        query = query.where(
            Issue.status.in_([IssueStatus.PWD_WORKING, IssueStatus.STARTED_WORKING])
        )
        count_query = count_query.where(
            Issue.status.in_([IssueStatus.PWD_WORKING, IssueStatus.STARTED_WORKING])
        )
    elif filter_type == "completed":
        # Issues PWD has completed (waiting for Parshad review)
        query = query.where(Issue.status == IssueStatus.PWD_COMPLETED)
        count_query = count_query.where(Issue.status == IssueStatus.PWD_COMPLETED)
    else:
        # All issues that PWD can see (acknowledged onwards)
        query = query.where(
            Issue.status.in_([
                IssueStatus.PARSHAD_ACKNOWLEDGED,
                IssueStatus.PWD_WORKING,
                IssueStatus.PWD_COMPLETED,
                IssueStatus.PARSHAD_CHECK,  # Legacy
                IssueStatus.STARTED_WORKING  # Legacy
            ])
        )
        count_query = count_query.where(
            Issue.status.in_([
                IssueStatus.PARSHAD_ACKNOWLEDGED,
                IssueStatus.PWD_WORKING,
                IssueStatus.PWD_COMPLETED,
                IssueStatus.PARSHAD_CHECK,
                IssueStatus.STARTED_WORKING
            ])
        )
    
    if issue_type:
        query = query.where(Issue.issue_type == issue_type)
        count_query = count_query.where(Issue.issue_type == issue_type)
    
    total = session.exec(count_query).one()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Issue.updated_at.desc())
    
    issues = session.exec(query).all()
    items = [build_issue_response(issue, session) for issue in issues]
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    return AdminIssueListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@pwd_router.get(
    "/dashboard/worker",
    summary="Get PWD Worker specific dashboard stats",
)
async def get_pwd_worker_dashboard(
    pwd_user: User = Depends(get_pwd_user),
    session: Session = Depends(get_session),
):
    """
    Get dashboard statistics specifically for PWD field workers.
    """
    # Pending work (Parshad acknowledged, waiting for PWD)
    pending_work = session.exec(
        select(func.count(Issue.id)).where(
            Issue.status.in_([IssueStatus.PARSHAD_ACKNOWLEDGED, IssueStatus.PARSHAD_CHECK])
        )
    ).one()
    
    # In progress (PWD working)
    in_progress = session.exec(
        select(func.count(Issue.id)).where(
            Issue.status.in_([IssueStatus.PWD_WORKING, IssueStatus.STARTED_WORKING])
        )
    ).one()
    
    # Completed by PWD (waiting for Parshad review)
    pending_review = session.exec(
        select(func.count(Issue.id)).where(Issue.status == IssueStatus.PWD_COMPLETED)
    ).one()
    
    # Reviewed and closed
    completed = session.exec(
        select(func.count(Issue.id)).where(
            Issue.status.in_([IssueStatus.PARSHAD_REVIEWED, IssueStatus.FINISHED_WORK])
        )
    ).one()
    
    # Issues by type (for pending work)
    issues_by_type = {}
    for issue_type in IssueType:
        count = session.exec(
            select(func.count(Issue.id)).where(
                Issue.issue_type == issue_type,
                Issue.status.in_([IssueStatus.PARSHAD_ACKNOWLEDGED, IssueStatus.PARSHAD_CHECK])
            )
        ).one()
        issues_by_type[issue_type.value] = count
    
    return {
        "pending_work": pending_work,
        "in_progress": in_progress,
        "pending_review": pending_review,
        "completed": completed,
        "issues_by_type": issues_by_type,
    }


@pwd_router.post(
    "/issues/{issue_id}/start-work",
    response_model=AdminIssueResponse,
    summary="PWD worker starts working on an issue",
)
async def pwd_start_work(
    issue_id: int,
    notes: Optional[str] = Query(None, description="Work notes"),
    pwd_user: User = Depends(get_pwd_user),
    session: Session = Depends(get_session),
):
    """
    Mark that PWD workers have started working on the issue.
    
    The issue must be in PARSHAD_ACKNOWLEDGED status (Parshad has confirmed it exists).
    """
    from datetime import timezone
    
    issue = session.get(Issue, issue_id)
    
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue with id {issue_id} not found"
        )
    
    # Check valid status transition
    if issue.status not in [IssueStatus.PARSHAD_ACKNOWLEDGED, IssueStatus.PARSHAD_CHECK]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start work on issue with status {issue.status.value}. "
                   f"Issue must be acknowledged by Parshad first."
        )
    
    issue.status = IssueStatus.PWD_WORKING
    
    if notes:
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
        new_note = f"[{timestamp}] PWD Started: {notes}"
        
        if issue.progress_notes:
            issue.progress_notes = f"{issue.progress_notes}\n\n{new_note}"
        else:
            issue.progress_notes = new_note
    
    session.add(issue)
    session.commit()
    session.refresh(issue)
    
    return build_issue_response(issue, session)


@pwd_router.post(
    "/issues/{issue_id}/complete-work",
    response_model=AdminIssueResponse,
    summary="PWD worker completes work on an issue",
)
async def pwd_complete_work(
    issue_id: int,
    notes: Optional[str] = Query(None, description="Completion notes"),
    pwd_user: User = Depends(get_pwd_user),
    session: Session = Depends(get_session),
):
    """
    Mark that PWD workers have completed work on the issue.
    
    The issue will then need to be reviewed by the Parshad for final closure.
    """
    from datetime import timezone
    
    issue = session.get(Issue, issue_id)
    
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue with id {issue_id} not found"
        )
    
    # Check valid status transition
    if issue.status not in [IssueStatus.PWD_WORKING, IssueStatus.STARTED_WORKING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot complete issue with status {issue.status.value}. "
                   f"Work must be started first."
        )
    
    issue.status = IssueStatus.PWD_COMPLETED
    
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    completion_note = f"[{timestamp}] PWD Completed: {notes or 'Work finished'}"
    
    if issue.progress_notes:
        issue.progress_notes = f"{issue.progress_notes}\n\n{completion_note}"
    else:
        issue.progress_notes = completion_note
    
    session.add(issue)
    session.commit()
    session.refresh(issue)
    
    return build_issue_response(issue, session)


@pwd_router.post(
    "/issues/{issue_id}/assign",
    response_model=AdminIssueResponse,
    summary="Assign Parshad to an issue",
)
async def assign_parshad(
    issue_id: int,
    assignment: AssignParshadRequest,
    pwd_user: User = Depends(get_pwd_user),
    session: Session = Depends(get_session),
):
    """
    Assign a Parshad to handle an issue.
    
    **PWD Worker Only**: Assign or reassign Parshads to issues.
    
    - **parshad_id**: ID of the Parshad to assign
    - **assignment_notes**: Optional notes for the Parshad
    """
    issue = session.get(Issue, issue_id)
    
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue with id {issue_id} not found"
        )
    
    # Verify Parshad exists and is active
    parshad = session.get(User, assignment.parshad_id)
    
    if not parshad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parshad with id {assignment.parshad_id} not found"
        )
    
    if parshad.role != UserRole.PARSHAD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected user is not a Parshad"
        )
    
    if not parshad.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected Parshad is not active"
        )
    
    # Assign Parshad
    issue.assigned_parshad_id = assignment.parshad_id
    issue.assignment_notes = assignment.assignment_notes
    issue.status = IssueStatus.ASSIGNED
    
    session.add(issue)
    session.commit()
    session.refresh(issue)
    
    return build_issue_response(issue, session)


@pwd_router.patch(
    "/issues/{issue_id}",
    response_model=AdminIssueResponse,
    summary="Update issue assignment",
)
async def update_issue_assignment(
    issue_id: int,
    update_data: PWDStatusUpdate,
    pwd_user: User = Depends(get_pwd_user),
    session: Session = Depends(get_session),
):
    """
    Update issue assignment (reassign Parshad or update notes).
    """
    issue = session.get(Issue, issue_id)
    
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue with id {issue_id} not found"
        )
    
    if update_data.assigned_parshad_id is not None:
        # Verify new Parshad
        parshad = session.get(User, update_data.assigned_parshad_id)
        
        if not parshad or parshad.role != UserRole.PARSHAD:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Parshad ID"
            )
        
        issue.assigned_parshad_id = update_data.assigned_parshad_id
        issue.status = IssueStatus.ASSIGNED  # Reset status on reassignment
    
    if update_data.assignment_notes is not None:
        issue.assignment_notes = update_data.assignment_notes
    
    session.add(issue)
    session.commit()
    session.refresh(issue)
    
    return build_issue_response(issue, session)


# ==================== Parshad Management ====================

@pwd_router.post(
    "/parshads",
    response_model=AdminUserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Parshad account",
)
async def create_parshad(
    parshad_data: CreateParshadRequest,
    pwd_user: User = Depends(get_pwd_user),
    session: Session = Depends(get_session),
):
    """
    Create a new Parshad account.
    
    **PWD Worker Only**: Only PWD workers can create Parshad accounts.
    
    The Parshad will be created with:
    - role: PARSHAD
    - is_verified: True (pre-verified by PWD)
    - is_active: True
    
    - **name**: Parshad's full name
    - **mobile_number**: Mobile number (will be used for login)
    - **village_name**: Village/area name
    - **latitude**: Optional location latitude
    - **longitude**: Optional location longitude
    """
    from app.services.twilio import normalize_phone_number
    
    # Normalize phone number
    normalized_number = normalize_phone_number(parshad_data.mobile_number)
    
    # Check if user already exists
    existing_user = session.exec(
        select(User).where(User.mobile_number == normalized_number)
    ).first()
    
    if existing_user:
        if existing_user.role == UserRole.PARSHAD:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A Parshad with this mobile number already exists"
            )
        else:
            # Upgrade existing user to Parshad
            existing_user.role = UserRole.PARSHAD
            existing_user.is_verified = True
            if parshad_data.village_name:
                existing_user.village_name = parshad_data.village_name
            if parshad_data.ward_id is not None:
                existing_user.ward_id = parshad_data.ward_id
            if parshad_data.latitude is not None:
                existing_user.latitude = parshad_data.latitude
            if parshad_data.longitude is not None:
                existing_user.longitude = parshad_data.longitude
            
            session.add(existing_user)
            session.commit()
            session.refresh(existing_user)
            
            return AdminUserResponse(
                id=existing_user.id,
                name=existing_user.name,
                mobile_number=existing_user.mobile_number,
                role=existing_user.role,
                is_active=existing_user.is_active,
                is_verified=existing_user.is_verified,
                village_name=existing_user.village_name,
                ward_id=existing_user.ward_id,
                latitude=existing_user.latitude,
                longitude=existing_user.longitude,
                created_at=existing_user.created_at,
                updated_at=existing_user.updated_at,
                total_reports=0,
                assigned_issues=0,
            )
    
    # Create new Parshad
    new_parshad = User(
        name=parshad_data.name,
        mobile_number=normalized_number,
        role=UserRole.PARSHAD,
        is_active=True,
        is_verified=True,  # Pre-verified by PWD
        village_name=parshad_data.village_name,
        ward_id=parshad_data.ward_id,
        latitude=parshad_data.latitude,
        longitude=parshad_data.longitude,
    )
    
    session.add(new_parshad)
    session.commit()
    session.refresh(new_parshad)
    
    return AdminUserResponse(
        id=new_parshad.id,
        name=new_parshad.name,
        mobile_number=new_parshad.mobile_number,
        role=new_parshad.role,
        is_active=new_parshad.is_active,
        is_verified=new_parshad.is_verified,
        village_name=new_parshad.village_name,
        ward_id=new_parshad.ward_id,
        latitude=new_parshad.latitude,
        longitude=new_parshad.longitude,
        created_at=new_parshad.created_at,
        updated_at=new_parshad.updated_at,
        total_reports=0,
        assigned_issues=0,
    )


@pwd_router.get(
    "/parshads",
    response_model=ParshadListResponse,
    summary="Get all Parshads",
)
async def get_all_parshads(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name or village"),
    pwd_user: User = Depends(get_pwd_user),
    session: Session = Depends(get_session),
):
    """
    Get list of all Parshads for assignment.
    """
    query = select(User).where(User.role == UserRole.PARSHAD)
    
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    
    if search:
        query = query.where(
            (User.name.contains(search)) | (User.village_name.contains(search))
        )
    
    parshads = session.exec(query.order_by(User.name)).all()
    
    items = [
        ParshadInfo(
            id=p.id,
            name=p.name,
            mobile_number=p.mobile_number,
            village_name=p.village_name,
            ward_id=p.ward_id,
            latitude=p.latitude,
            longitude=p.longitude,
        )
        for p in parshads
    ]
    
    return ParshadListResponse(items=items, total=len(items))


@pwd_router.get(
    "/parshads/{parshad_id}/issues",
    response_model=AdminIssueListResponse,
    summary="Get issues assigned to a Parshad",
)
async def get_parshad_issues(
    parshad_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[IssueStatus] = Query(None, alias="status"),
    pwd_user: User = Depends(get_pwd_user),
    session: Session = Depends(get_session),
):
    """
    Get all issues assigned to a specific Parshad.
    
    Useful for monitoring Parshad workload and performance.
    """
    # Verify Parshad exists
    parshad = session.get(User, parshad_id)
    if not parshad or parshad.role != UserRole.PARSHAD:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parshad not found"
        )
    
    # Build query
    query = select(Issue).where(Issue.assigned_parshad_id == parshad_id)
    count_query = select(func.count(Issue.id)).where(Issue.assigned_parshad_id == parshad_id)
    
    if status_filter:
        query = query.where(Issue.status == status_filter)
        count_query = count_query.where(Issue.status == status_filter)
    
    total = session.exec(count_query).one()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Issue.updated_at.desc())
    
    issues = session.exec(query).all()
    items = [build_issue_response(issue, session) for issue in issues]
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    return AdminIssueListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ==================== User Management ====================

@pwd_router.get(
    "/users",
    response_model=UserListResponse,
    summary="Get all users",
)
async def get_all_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    pwd_user: User = Depends(get_pwd_user),
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
    
    items = []
    for user in users:
        report_count = session.exec(
            select(func.count(Issue.id)).where(Issue.user_id == user.id)
        ).one()
        
        assigned_count = 0
        if user.role == UserRole.PARSHAD:
            assigned_count = session.exec(
                select(func.count(Issue.id)).where(Issue.assigned_parshad_id == user.id)
            ).one()
        
        items.append(AdminUserResponse(
            id=user.id,
            name=user.name,
            mobile_number=user.mobile_number,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            village_name=user.village_name,
            latitude=user.latitude,
            longitude=user.longitude,
            created_at=user.created_at,
            updated_at=user.updated_at,
            total_reports=report_count,
            assigned_issues=assigned_count,
        ))
    
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    return UserListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@pwd_router.patch(
    "/users/{user_id}",
    response_model=AdminUserResponse,
    summary="Update user role and details",
)
async def update_user(
    user_id: int,
    update_data: UserRoleUpdate,
    pwd_user: User = Depends(get_pwd_user),
    session: Session = Depends(get_session),
):
    """
    Update user role, status, or location details.
    
    Use this to:
    - Promote a user to Parshad
    - Set Parshad's village and location
    - Activate/deactivate users
    """
    user = session.get(User, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Cannot modify PWD workers (only another PWD can do this via DB)
    if user.role == UserRole.PWD_WORKER and user.id != pwd_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify other PWD workers"
        )
    
    if update_data.role is not None:
        # Cannot make someone a PWD worker via API
        if update_data.role == UserRole.PWD_WORKER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot assign PWD Worker role via API"
            )
        user.role = update_data.role
    
    if update_data.is_active is not None:
        user.is_active = update_data.is_active
    
    if update_data.village_name is not None:
        user.village_name = update_data.village_name
    
    if update_data.latitude is not None:
        user.latitude = update_data.latitude
    
    if update_data.longitude is not None:
        user.longitude = update_data.longitude
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    report_count = session.exec(
        select(func.count(Issue.id)).where(Issue.user_id == user.id)
    ).one()
    
    assigned_count = 0
    if user.role == UserRole.PARSHAD:
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
        village_name=user.village_name,
        latitude=user.latitude,
        longitude=user.longitude,
        created_at=user.created_at,
        updated_at=user.updated_at,
        total_reports=report_count,
        assigned_issues=assigned_count,
    )
