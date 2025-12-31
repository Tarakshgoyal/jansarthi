"""Parshad API routes - for managing assigned issues and updating progress"""

import math
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi import status as http_status
from sqlmodel import Session, func, or_, select

from app.database import get_session
from app.models.issue import Issue, IssuePhoto, IssueStatus, IssueType, User, UserRole
from app.schemas.admin import (
    AdminIssueListResponse,
    AdminIssueResponse,
    IssueCountByType,
    ParshadDashboardStats,
    ParshadInfo,
    ParshadStatusUpdate,
    UserInfo,
)
from app.services.auth import get_current_active_user
from app.services.storage import get_storage_service
from app.settings.config import get_settings

settings = get_settings()
parshad_router = APIRouter(prefix="/api/parshad", tags=["Parshad"])


async def get_parshad_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Dependency to verify user is a Parshad
    """
    if current_user.role != UserRole.REPRESENTATIVE:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Parshad privileges required"
        )
    return current_user


def build_issue_response(issue: Issue, session: Session) -> AdminIssueResponse:
    """Helper to build AdminIssueResponse with related data"""
    from app.services.storage import get_storage_service
    
    reporter = None
    if issue.user_id:
        user = session.get(User, issue.user_id)
        if user:
            reporter = UserInfo(id=user.id, name=user.name, mobile_number=user.mobile_number)
    
    assigned_parshad = None
    if issue.assigned_parshad_id:
        parshad = session.get(User, issue.assigned_parshad_id)
        if parshad:
            locality_name = None
            if parshad.locality_id:
                from app.models.issue import Locality
                locality = session.get(Locality, parshad.locality_id)
                if locality:
                    locality_name = locality.name
            assigned_parshad = ParshadInfo(
                id=parshad.id,
                name=parshad.name,
                mobile_number=parshad.mobile_number,
                locality_id=parshad.locality_id,
                locality_name=locality_name,
            )
    
    # Get completion photo URL if exists
    completion_photo_url = None
    if issue.completion_photo_url:
        storage_service = get_storage_service()
        completion_photo_url = storage_service.get_file_url(issue.completion_photo_url)
    
    # Get completed by name
    completed_by_name = None
    if issue.completed_by_id:
        completed_by = session.get(User, issue.completed_by_id)
        if completed_by:
            completed_by_name = completed_by.name
    
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
        completion_description=issue.completion_description,
        completion_photo_url=completion_photo_url,
        completed_at=issue.completed_at,
        completed_by_id=issue.completed_by_id,
        completed_by_name=completed_by_name,
        created_at=issue.created_at,
        updated_at=issue.updated_at,
        photo_count=len(issue.photos),
    )


# ==================== Dashboard ====================

@parshad_router.get(
    "/dashboard",
    response_model=ParshadDashboardStats,
    summary="Get Parshad dashboard statistics",
)
async def get_parshad_dashboard(
    parshad_user: User = Depends(get_parshad_user),
    session: Session = Depends(get_session),
):
    """
    Get dashboard statistics for the logged-in Parshad.
    
    Shows issues assigned to this Parshad OR unassigned issues from their ward.
    """
    parshad_id = parshad_user.id
    locality_id = parshad_user.locality_id
    
    # Condition: assigned to this Parshad OR (in their ward and unassigned/reported)
    def parshad_issue_filter():
        if locality_id:
            return or_(
                Issue.assigned_parshad_id == parshad_id,
                (Issue.locality_id == locality_id) & (Issue.assigned_parshad_id == None)
            )
        return Issue.assigned_parshad_id == parshad_id
    
    # Total assigned to this Parshad or in their ward
    total_assigned = session.exec(
        select(func.count(Issue.id)).where(parshad_issue_filter())
    ).one()
    
    # Pending acknowledgement (status = ASSIGNED or REPORTED for unassigned ward issues)
    pending_acknowledgement = session.exec(
        select(func.count(Issue.id)).where(
            parshad_issue_filter(),
            Issue.status.in_([IssueStatus.ASSIGNED, IssueStatus.REPORTED])
        )
    ).one()
    
    # In progress (REPRESENTATIVE_ACKNOWLEDGED, PWD_WORKING)
    in_progress = session.exec(
        select(func.count(Issue.id)).where(
            parshad_issue_filter(),
            Issue.status.in_([
                IssueStatus.REPRESENTATIVE_ACKNOWLEDGED,
                IssueStatus.PWD_WORKING
            ])
        )
    ).one()
    
    # Pending review (PWD_COMPLETED - needs Parshad to verify)
    pending_review = session.exec(
        select(func.count(Issue.id)).where(
            parshad_issue_filter(),
            Issue.status == IssueStatus.PWD_COMPLETED
        )
    ).one()
    
    # Completed (REPRESENTATIVE_REVIEWED)
    completed = session.exec(
        select(func.count(Issue.id)).where(
            parshad_issue_filter(),
            Issue.status == IssueStatus.REPRESENTATIVE_REVIEWED
        )
    ).one()
    
    # Issues by type (for this Parshad)
    issues_by_type = IssueCountByType()
    for issue_type in IssueType:
        count = session.exec(
            select(func.count(Issue.id)).where(
                parshad_issue_filter(),
                Issue.issue_type == issue_type
            )
        ).one()
        setattr(issues_by_type, issue_type.value, count)
    
    return ParshadDashboardStats(
        total_assigned=total_assigned,
        pending_acknowledgement=pending_acknowledgement,
        in_progress=in_progress,
        pending_review=pending_review,
        completed=completed,
        issues_by_type=issues_by_type,
    )


# ==================== Issue Management ====================

@parshad_router.get(
    "/issues",
    response_model=AdminIssueListResponse,
    summary="Get issues assigned to this Parshad",
)
async def get_my_issues(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    issue_type: Optional[IssueType] = Query(None, description="Filter by issue type"),
    status_filter: Optional[IssueStatus] = Query(None, alias="status", description="Filter by status"),
    parshad_user: User = Depends(get_parshad_user),
    session: Session = Depends(get_session),
):
    """
    Get paginated list of issues assigned to this Parshad or in their ward.
    
    **Parshad Only**: Sees issues assigned to them or unassigned issues from their ward.
    """
    parshad_id = parshad_user.id
    locality_id = parshad_user.locality_id
    
    # Build query - issues assigned to this Parshad OR unassigned issues from their ward
    if locality_id:
        base_filter = or_(
            Issue.assigned_parshad_id == parshad_id,
            (Issue.locality_id == locality_id) & (Issue.assigned_parshad_id == None)
        )
    else:
        base_filter = Issue.assigned_parshad_id == parshad_id
    
    query = select(Issue).where(base_filter)
    count_query = select(func.count(Issue.id)).where(base_filter)
    
    # Apply filters
    if issue_type:
        query = query.where(Issue.issue_type == issue_type)
        count_query = count_query.where(Issue.issue_type == issue_type)
    
    if status_filter:
        query = query.where(Issue.status == status_filter)
        count_query = count_query.where(Issue.status == status_filter)
    
    # Get total count
    total = session.exec(count_query).one()
    
    # Apply pagination and sorting (newest first, then by status priority)
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Issue.updated_at.desc())
    
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


@parshad_router.get(
    "/issues/pending",
    response_model=AdminIssueListResponse,
    summary="Get pending issues needing acknowledgement",
)
async def get_pending_issues(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    parshad_user: User = Depends(get_parshad_user),
    session: Session = Depends(get_session),
):
    """
    Get issues that are newly assigned and need acknowledgement.
    
    These are issues with status = ASSIGNED or REPORTED (unassigned from their ward).
    """
    parshad_id = parshad_user.id
    locality_id = parshad_user.locality_id
    
    # Include unassigned issues from ward with REPORTED status
    if locality_id:
        base_filter = or_(
            (Issue.assigned_parshad_id == parshad_id) & (Issue.status == IssueStatus.ASSIGNED),
            (Issue.locality_id == locality_id) & (Issue.assigned_parshad_id == None) & (Issue.status == IssueStatus.REPORTED)
        )
    else:
        base_filter = (Issue.assigned_parshad_id == parshad_id) & (Issue.status == IssueStatus.ASSIGNED)
    
    query = select(Issue).where(base_filter)
    count_query = select(func.count(Issue.id)).where(base_filter)
    
    total = session.exec(count_query).one()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Issue.created_at.asc())  # Oldest first
    
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


@parshad_router.get(
    "/issues/in-progress",
    response_model=AdminIssueListResponse,
    summary="Get in-progress issues",
)
async def get_in_progress_issues(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    parshad_user: User = Depends(get_parshad_user),
    session: Session = Depends(get_session),
):
    """
    Get issues that are in progress (REPRESENTATIVE_ACKNOWLEDGED or PWD_WORKING).
    
    These are issues the Parshad has acknowledged or started working on.
    """
    parshad_id = parshad_user.id
    locality_id = parshad_user.locality_id
    
    # Include ward issues that are in progress
    if locality_id:
        base_filter = or_(
            Issue.assigned_parshad_id == parshad_id,
            (Issue.locality_id == locality_id) & (Issue.assigned_parshad_id == None)
        )
    else:
        base_filter = Issue.assigned_parshad_id == parshad_id
    
    query = select(Issue).where(
        base_filter,
        Issue.status.in_([IssueStatus.REPRESENTATIVE_ACKNOWLEDGED, IssueStatus.PWD_WORKING])
    )
    count_query = select(func.count(Issue.id)).where(
        base_filter,
        Issue.status.in_([IssueStatus.REPRESENTATIVE_ACKNOWLEDGED, IssueStatus.PWD_WORKING])
    )
    
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


@parshad_router.get(
    "/issues/pending-review",
    response_model=AdminIssueListResponse,
    summary="Get issues pending Parshad review",
)
async def get_pending_review_issues(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    parshad_user: User = Depends(get_parshad_user),
    session: Session = Depends(get_session),
):
    """
    Get issues where PWD has completed work and waiting for Parshad review.
    
    These are issues with status = PWD_COMPLETED.
    """
    parshad_id = parshad_user.id
    locality_id = parshad_user.locality_id
    
    # Include ward issues pending review
    if locality_id:
        base_filter = or_(
            Issue.assigned_parshad_id == parshad_id,
            (Issue.locality_id == locality_id) & (Issue.assigned_parshad_id == None)
        )
    else:
        base_filter = Issue.assigned_parshad_id == parshad_id
    
    query = select(Issue).where(
        base_filter,
        Issue.status == IssueStatus.PWD_COMPLETED
    )
    count_query = select(func.count(Issue.id)).where(
        base_filter,
        Issue.status == IssueStatus.PWD_COMPLETED
    )
    
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


@parshad_router.get(
    "/issues/{issue_id}",
    response_model=AdminIssueResponse,
    summary="Get issue details",
)
async def get_issue_detail(
    issue_id: int,
    parshad_user: User = Depends(get_parshad_user),
    session: Session = Depends(get_session),
):
    """
    Get detailed information about a specific assigned issue.
    """
    issue = session.get(Issue, issue_id)
    
    if not issue:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Issue with id {issue_id} not found"
        )
    
    # Verify issue is assigned to this Parshad OR in their ward
    locality_id = parshad_user.locality_id
    is_assigned = issue.assigned_parshad_id == parshad_user.id
    is_in_ward = locality_id and issue.locality_id == locality_id and issue.assigned_parshad_id is None
    
    if not is_assigned and not is_in_ward:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="This issue is not assigned to you or in your ward"
        )
    
    return build_issue_response(issue, session)


@parshad_router.patch(
    "/issues/{issue_id}/status",
    response_model=AdminIssueResponse,
    summary="Update issue status and progress",
)
async def update_issue_status(
    issue_id: int,
    status_update: ParshadStatusUpdate,
    parshad_user: User = Depends(get_parshad_user),
    session: Session = Depends(get_session),
):
    """
    Update the status of an assigned issue.
    
    **Parshad Only**: Can update issues assigned to them or unassigned issues from their ward.
    
    Valid status transitions:
    - REPORTED → REPRESENTATIVE_ACKNOWLEDGED (acknowledge unassigned ward issue)
    - ASSIGNED → REPRESENTATIVE_ACKNOWLEDGED (acknowledge receipt)
    - PWD_COMPLETED → REPRESENTATIVE_REVIEWED (review completed work)
    
    - **status**: New status
    - **progress_notes**: Notes about the progress/work done
    """
    issue = session.get(Issue, issue_id)
    
    if not issue:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Issue with id {issue_id} not found"
        )
    
    # Verify issue is assigned to this Parshad OR is an unassigned issue in their ward
    locality_id = parshad_user.locality_id
    is_assigned = issue.assigned_parshad_id == parshad_user.id
    is_unassigned_in_ward = (
        locality_id and 
        issue.locality_id == locality_id and 
        issue.assigned_parshad_id is None
    )
    
    if not is_assigned and not is_unassigned_in_ward:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="This issue is not assigned to you or in your ward"
        )
    
    # Validate status transition - NEW FLOW
    # Parshad can:
    # 1. Acknowledge issue (ASSIGNED/REPORTED -> REPRESENTATIVE_ACKNOWLEDGED)
    # 2. Review completed work (PWD_COMPLETED -> REPRESENTATIVE_REVIEWED)
    valid_transitions = {
        IssueStatus.REPORTED: [IssueStatus.REPRESENTATIVE_ACKNOWLEDGED],  # For unassigned ward issues
        IssueStatus.ASSIGNED: [IssueStatus.REPRESENTATIVE_ACKNOWLEDGED],
        IssueStatus.PWD_COMPLETED: [IssueStatus.REPRESENTATIVE_REVIEWED],
        IssueStatus.REPRESENTATIVE_REVIEWED: [],  # Cannot change after completion
    }
    
    allowed_statuses = valid_transitions.get(issue.status, [])
    
    if status_update.status not in allowed_statuses:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from {issue.status.value} to {status_update.status.value}. "
                   f"Allowed: {[s.value for s in allowed_statuses]}"
        )
    
    # Update status and notes
    issue.status = status_update.status
    
    if status_update.progress_notes:
        # Append to existing notes with timestamp
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
        new_note = f"[{timestamp}] {status_update.progress_notes}"
        
        if issue.progress_notes:
            issue.progress_notes = f"{issue.progress_notes}\n\n{new_note}"
        else:
            issue.progress_notes = new_note
    
    session.add(issue)
    session.commit()
    session.refresh(issue)
    
    return build_issue_response(issue, session)


@parshad_router.post(
    "/issues/{issue_id}/update-with-photos",
    response_model=AdminIssueResponse,
    summary="Update issue status with photo proof",
)
async def update_issue_with_photos(
    issue_id: int,
    new_status: IssueStatus = Form(..., alias="status", description="New status"),
    progress_notes: Optional[str] = Form(None, description="Progress notes"),
    photos: list[UploadFile] = File(default=[], description="Photo proof of work"),
    parshad_user: User = Depends(get_parshad_user),
    session: Session = Depends(get_session),
):
    """
    Update issue status with optional photo proof.
    
    **Parshad Only**: Update status and upload photos as proof of work.
    
    - **status**: New status (representative_acknowledged, representative_reviewed)
    - **progress_notes**: Notes about the progress/work done
    - **photos**: Up to 5 photos as proof of work
    """
    issue = session.get(Issue, issue_id)
    
    if not issue:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Issue with id {issue_id} not found"
        )
    
    # Verify issue is assigned to this Parshad OR is an unassigned issue in their ward
    locality_id = parshad_user.locality_id
    is_assigned = issue.assigned_parshad_id == parshad_user.id
    is_unassigned_in_ward = (
        locality_id and 
        issue.locality_id == locality_id and 
        issue.assigned_parshad_id is None
    )
    
    if not is_assigned and not is_unassigned_in_ward:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="This issue is not assigned to you or in your ward"
        )
    
    # Validate number of photos
    if len(photos) > 5:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 photos allowed per update"
        )
    
    # Validate status transition
    valid_transitions = {
        IssueStatus.REPORTED: [IssueStatus.REPRESENTATIVE_ACKNOWLEDGED],  # For unassigned ward issues
        IssueStatus.ASSIGNED: [IssueStatus.REPRESENTATIVE_ACKNOWLEDGED],
        IssueStatus.PWD_COMPLETED: [IssueStatus.REPRESENTATIVE_REVIEWED],
        IssueStatus.REPRESENTATIVE_REVIEWED: [],
    }
    
    allowed_statuses = valid_transitions.get(issue.status, [])
    
    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from {issue.status.value} to {new_status.value}. "
                   f"Allowed: {[s.value for s in allowed_statuses]}"
        )
    
    # Upload photos if provided
    storage_service = get_storage_service()
    uploaded_photos = []
    
    for photo in photos:
        if photo.content_type not in settings.allowed_image_types:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type: {photo.content_type}"
            )
        
        content = await photo.read()
        if len(content) > settings.max_file_size:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"File {photo.filename} exceeds maximum size"
            )
        
        try:
            object_name = storage_service.upload_file(
                file_data=content,
                filename=photo.filename or "image.jpg",
                content_type=photo.content_type or "image/jpeg",
            )
            
            issue_photo = IssuePhoto(
                issue_id=issue.id,
                photo_url=object_name,
                filename=photo.filename or "image.jpg",
                file_size=len(content),
                content_type=photo.content_type or "image/jpeg",
            )
            session.add(issue_photo)
            uploaded_photos.append(issue_photo)
        except Exception as e:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload photo: {str(e)}"
            )
    
    # Update status and notes
    issue.status = new_status
    
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    status_label = new_status.value.replace("_", " ").title()
    new_note = f"[{timestamp}] Status: {status_label}"
    
    if progress_notes:
        new_note += f"\n{progress_notes}"
    
    if uploaded_photos:
        new_note += f"\n({len(uploaded_photos)} photo(s) uploaded as proof)"
    
    if issue.progress_notes:
        issue.progress_notes = f"{issue.progress_notes}\n\n{new_note}"
    else:
        issue.progress_notes = new_note
    
    session.add(issue)
    session.commit()
    session.refresh(issue)
    
    return build_issue_response(issue, session)


@parshad_router.post(
    "/issues/{issue_id}/acknowledge",
    response_model=AdminIssueResponse,
    summary="Acknowledge an assigned issue",
)
async def acknowledge_issue(
    issue_id: int,
    parshad_user: User = Depends(get_parshad_user),
    session: Session = Depends(get_session),
):
    """
    Quick action to acknowledge a newly assigned issue or unassigned ward issue.
    
    Changes status from ASSIGNED/REPORTED to REPRESENTATIVE_ACKNOWLEDGED.
    """
    issue = session.get(Issue, issue_id)
    
    if not issue:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Issue with id {issue_id} not found"
        )
    
    # Verify issue is assigned to this Parshad OR is an unassigned issue in their ward
    locality_id = parshad_user.locality_id
    is_assigned = issue.assigned_parshad_id == parshad_user.id
    is_unassigned_in_ward = (
        locality_id and 
        issue.locality_id == locality_id and 
        issue.assigned_parshad_id is None
    )
    
    if not is_assigned and not is_unassigned_in_ward:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="This issue is not assigned to you or in your ward"
        )
    
    if issue.status not in [IssueStatus.ASSIGNED, IssueStatus.REPORTED]:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Issue is already acknowledged (status: {issue.status.value})"
        )
    
    issue.status = IssueStatus.REPRESENTATIVE_ACKNOWLEDGED
    
    # Add acknowledgement note
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    ack_note = f"[{timestamp}] Issue acknowledged by Parshad - Problem confirmed to exist"
    issue.progress_notes = ack_note
    
    session.add(issue)
    session.commit()
    session.refresh(issue)
    
    return build_issue_response(issue, session)


@parshad_router.post(
    "/issues/{issue_id}/start-work",
    response_model=AdminIssueResponse,
    summary="[DEPRECATED] Start working on an issue",
    deprecated=True,
)
async def start_work(
    issue_id: int,
    notes: Optional[str] = Query(None, description="Notes about starting work"),
    parshad_user: User = Depends(get_parshad_user),
    session: Session = Depends(get_session),
):
    """
    DEPRECATED: This endpoint is deprecated. PWD workers now handle work on issues.
    Use the PWD worker endpoints instead: /api/pwd/issues/{issue_id}/start-work
    
    Previously: Quick action to mark that work has started on an issue.
    Changes status from PARSHAD_CHECK to STARTED_WORKING.
    """
    raise HTTPException(
        status_code=http_status.HTTP_410_GONE,
        detail="This endpoint is deprecated. Work on issues is now handled by PWD workers. Use /api/pwd/issues/{issue_id}/start-work instead."
    )
    # Legacy code below - no longer executed
    issue = session.get(Issue, issue_id)
    
    if not issue:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Issue with id {issue_id} not found"
        )
    
    if issue.assigned_parshad_id != parshad_user.id:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="This issue is not assigned to you"
        )
    
    if issue.status != IssueStatus.PARSHAD_CHECK:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start work from status: {issue.status.value}. Must be in parshad_check status."
        )
    
    issue.status = IssueStatus.STARTED_WORKING
    
    # Add work start note
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    note = f"[{timestamp}] Work started"
    if notes:
        note += f": {notes}"
    
    if issue.progress_notes:
        issue.progress_notes = f"{issue.progress_notes}\n\n{note}"
    else:
        issue.progress_notes = note
    
    session.add(issue)
    session.commit()
    session.refresh(issue)
    
    return build_issue_response(issue, session)


@parshad_router.post(
    "/issues/{issue_id}/complete",
    response_model=AdminIssueResponse,
    summary="[DEPRECATED] Mark issue as completed",
    deprecated=True,
)
async def complete_issue(
    issue_id: int,
    notes: Optional[str] = Query(None, description="Completion notes"),
    parshad_user: User = Depends(get_parshad_user),
    session: Session = Depends(get_session),
):
    """
    DEPRECATED: This endpoint is deprecated. PWD workers now complete work on issues.
    Use the PWD worker endpoints instead: /api/pwd/issues/{issue_id}/complete-work
    Parshads should use the review endpoint: /api/parshad/issues/{issue_id}/review
    
    Previously: Quick action to mark an issue as completed.
    Changes status from STARTED_WORKING to FINISHED_WORK.
    """
    raise HTTPException(
        status_code=http_status.HTTP_410_GONE,
        detail="This endpoint is deprecated. Work completion is now handled by PWD workers. Use /api/pwd/issues/{issue_id}/complete-work instead. For final review, use /api/parshad/issues/{issue_id}/review."
    )
    # Legacy code below - no longer executed
    issue = session.get(Issue, issue_id)
    
    if not issue:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Issue with id {issue_id} not found"
        )
    
    if issue.assigned_parshad_id != parshad_user.id:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="This issue is not assigned to you"
        )
    
    if issue.status != IssueStatus.STARTED_WORKING:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot complete from status: {issue.status.value}. Must be in started_working status."
        )
    
    issue.status = IssueStatus.FINISHED_WORK
    
    # Add completion note
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    note = f"[{timestamp}] Work completed"
    if notes:
        note += f": {notes}"
    
    if issue.progress_notes:
        issue.progress_notes = f"{issue.progress_notes}\n\n{note}"
    else:
        issue.progress_notes = note
    
    session.add(issue)
    session.commit()
    session.refresh(issue)
    
    return build_issue_response(issue, session)


@parshad_router.post(
    "/issues/{issue_id}/review",
    response_model=AdminIssueResponse,
    summary="Review and close PWD completed work",
)
async def review_issue(
    issue_id: int,
    notes: Optional[str] = Query(None, description="Review notes"),
    parshad_user: User = Depends(get_parshad_user),
    session: Session = Depends(get_session),
):
    """
    Review and approve PWD completed work.
    
    This is the final step in the new flow where Parshad verifies 
    that PWD workers have successfully fixed the issue.
    
    Changes status from PWD_COMPLETED to REPRESENTATIVE_REVIEWED.
    """
    issue = session.get(Issue, issue_id)
    
    if not issue:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Issue with id {issue_id} not found"
        )
    
    if issue.assigned_parshad_id != parshad_user.id:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="This issue is not assigned to you"
        )
    
    if issue.status != IssueStatus.PWD_COMPLETED:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot review from status: {issue.status.value}. Issue must be completed by PWD first."
        )
    
    issue.status = IssueStatus.REPRESENTATIVE_REVIEWED
    
    # Add review note
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    note = f"[{timestamp}] Parshad Review: Work verified and issue closed"
    if notes:
        note += f" - {notes}"
    
    if issue.progress_notes:
        issue.progress_notes = f"{issue.progress_notes}\n\n{note}"
    else:
        issue.progress_notes = note
    
    session.add(issue)
    session.commit()
    session.refresh(issue)
    
    return build_issue_response(issue, session)
