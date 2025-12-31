import math
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlmodel import Session, select

from app.database import get_session
from app.models.issue import Issue, IssuePhoto, IssueStatus, IssueType, Locality, LocalityType, User, UserRole
from app.schemas.issue import (
    IssueCreate,
    IssueListResponse,
    IssueMapResponse,
    IssuePhotoResponse,
    IssueResponse,
    IssueStatusUpdate,
    IssueUpdate,
    PhotoUploadResponse,
)
from app.services.auth import get_current_active_user, get_optional_user
from app.services.storage import get_storage_service
from app.settings.config import get_settings

settings = get_settings()
reports_router = APIRouter(prefix="/api/reports", tags=["Reports"])


def build_issue_response(issue: Issue, storage_service, session: Session) -> IssueResponse:
    """Helper to build IssueResponse with presigned URLs for all photos"""
    # Generate presigned URLs for issue photos
    photos = []
    for photo in issue.photos:
        photo_response = IssuePhotoResponse(
            id=photo.id,
            photo_url=storage_service.get_file_url(photo.photo_url),
            filename=photo.filename,
            file_size=photo.file_size,
            content_type=photo.content_type,
            created_at=photo.created_at,
        )
        photos.append(photo_response)
    
    # Get completion photo URL if exists
    completion_photo_url = None
    if issue.completion_photo_url:
        completion_photo_url = storage_service.get_file_url(issue.completion_photo_url)
    
    # Get locality name and type if exists
    locality_name = None
    locality_type = None
    if issue.locality_id:
        locality = session.get(Locality, issue.locality_id)
        if locality:
            locality_name = locality.name
            locality_type = locality.type.value if locality.type else None
    
    return IssueResponse(
        id=issue.id,
        issue_type=issue.issue_type,
        description=issue.description,
        latitude=issue.latitude,
        longitude=issue.longitude,
        locality_id=issue.locality_id,
        locality_name=locality_name,
        locality_type=locality_type,
        status=issue.status,
        user_id=issue.user_id,
        assigned_parshad_id=issue.assigned_parshad_id,
        assignment_message=None,
        completion_description=issue.completion_description,
        completion_photo_url=completion_photo_url,
        completed_at=issue.completed_at,
        completed_by_id=issue.completed_by_id,
        created_at=issue.created_at,
        updated_at=issue.updated_at,
        photos=photos,
    )


@reports_router.post(
    "",
    response_model=IssueResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new issue report",
)
async def create_issue(
    issue_type: IssueType = Form(...),
    description: str = Form(..., min_length=10, max_length=2000),
    latitude: float = Form(..., ge=-90, le=90),
    longitude: float = Form(..., ge=-180, le=180),
    locality_id: Optional[int] = Form(None, description="Locality ID (ward or village)"),
    photos: list[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """
    Create a new issue report with photos.
    
    **Authentication Required**: Must provide valid access token.

    - **issue_type**: Type of issue (water, electricity, road, garbage)
    - **description**: Detailed description of the issue
    - **latitude**: Location latitude
    - **longitude**: Location longitude
    - **locality_id**: Locality ID (ward or village)
    - **photos**: Up to 3 photos of the issue
    
    The user_id is automatically extracted from the authentication token.
    """
    # Validate number of photos
    if len(photos) > settings.max_photos_per_issue:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {settings.max_photos_per_issue} photos allowed",
        )

    # Validate photo types and sizes
    storage_service = get_storage_service()

    for photo in photos:
        if photo.content_type not in settings.allowed_image_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type: {photo.content_type}. Allowed types: {settings.allowed_image_types}",
            )

        # Read file to check size
        content = await photo.read()
        if len(content) > settings.max_file_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File {photo.filename} exceeds maximum size of {settings.max_file_size / (1024 * 1024)}MB",
            )
        # Reset file pointer for later use
        await photo.seek(0)

    # Auto-assign to Parshad of this ward if locality_id is provided
    assigned_parshad_id = None
    assignment_message = None
    initial_status = IssueStatus.REPORTED
    
    if locality_id is not None:
        # Find a Parshad assigned to this ward
        parshad = session.exec(
            select(User).where(
                User.role == UserRole.REPRESENTATIVE,
                User.locality_id == locality_id,
                User.is_active == True
            )
        ).first()
        
        if parshad:
            assigned_parshad_id = parshad.id
            initial_status = IssueStatus.ASSIGNED
            assignment_message = f"Auto-assigned to Parshad {parshad.name} of ward {locality_id}"
        else:
            assignment_message = f"No Parshad assigned to ward {locality_id}. Issue is unassigned."

    # Create issue record
    new_issue = Issue(
        issue_type=issue_type,
        description=description,
        latitude=latitude,
        longitude=longitude,
        locality_id=locality_id,
        user_id=current_user.id,
        assigned_parshad_id=assigned_parshad_id,
        assignment_notes=assignment_message,
        status=initial_status,
    )

    session.add(new_issue)
    session.commit()
    session.refresh(new_issue)

    # Upload photos and create photo records
    for photo in photos:
        try:
            # Read file content
            content = await photo.read()

            # Upload to MinIO
            object_name = storage_service.upload_file(
                file_data=content,
                filename=photo.filename or "image.jpg",
                content_type=photo.content_type or "image/jpeg",
            )

            # Create photo record
            issue_photo = IssuePhoto(
                issue_id=new_issue.id,
                photo_url=object_name,
                filename=photo.filename or "image.jpg",
                file_size=len(content),
                content_type=photo.content_type or "image/jpeg",
            )
            session.add(issue_photo)

        except Exception as e:
            # Rollback on error
            session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload photo: {str(e)}",
            )

    session.commit()
    session.refresh(new_issue)

    # Generate presigned URLs for photos
    for photo in new_issue.photos:
        photo.photo_url = storage_service.get_file_url(photo.photo_url)

    # Build response with assignment message
    return IssueResponse(
        id=new_issue.id,
        issue_type=new_issue.issue_type,
        description=new_issue.description,
        latitude=new_issue.latitude,
        longitude=new_issue.longitude,
        locality_id=new_issue.locality_id,
        status=new_issue.status,
        user_id=new_issue.user_id,
        assigned_parshad_id=new_issue.assigned_parshad_id,
        assignment_message=assignment_message,
        created_at=new_issue.created_at,
        updated_at=new_issue.updated_at,
        photos=[IssuePhotoResponse.model_validate(p) for p in new_issue.photos],
    )


@reports_router.get(
    "",
    response_model=IssueListResponse,
    summary="Get current user's issue reports (paginated)",
)
async def get_issues(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    issue_type: Optional[IssueType] = Query(None, description="Filter by issue type"),
    status_filter: Optional[IssueStatus] = Query(
        None, alias="status", description="Filter by status"
    ),
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """
    Get a paginated list of the current user's issue reports.
    
    **Authentication Required**: Must provide valid access token.

    - **page**: Page number (default: 1)
    - **page_size**: Number of items per page (default: 10, max: 100)
    - **issue_type**: Filter by specific issue type
    - **status**: Filter by issue status
    
    Only returns issues created by the authenticated user.
    """
    # Build query - filter by current user
    query = select(Issue).where(Issue.user_id == current_user.id)

    # Apply additional filters
    if issue_type:
        query = query.where(Issue.issue_type == issue_type)
    if status_filter:
        query = query.where(Issue.status == status_filter)

    # Count total items - filter by current user
    count_query = select(Issue).where(Issue.user_id == current_user.id)
    if issue_type:
        count_query = count_query.where(Issue.issue_type == issue_type)
    if status_filter:
        count_query = count_query.where(Issue.status == status_filter)

    total = len(session.exec(count_query).all())

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Issue.created_at.desc())

    issues = session.exec(query).all()

    # Build responses with presigned URLs
    storage_service = get_storage_service()
    issue_responses = [build_issue_response(issue, storage_service, session) for issue in issues]

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return IssueListResponse(
        items=issue_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@reports_router.get(
    "/map",
    response_model=list[IssueMapResponse],
    summary="Get issues for map view",
)
async def get_issues_for_map(
    latitude: float = Query(..., ge=-90, le=90, description="Center latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Center longitude"),
    radius: float = Query(
        10.0, ge=0.1, le=100, description="Search radius in kilometers"
    ),
    issue_type: Optional[IssueType] = Query(None, description="Filter by issue type"),
    status_filter: Optional[IssueStatus] = Query(
        None, alias="status", description="Filter by status"
    ),
    session: Session = Depends(get_session),
):
    """
    Get issues near a location for map display (optimized response).

    - **latitude**: Center point latitude
    - **longitude**: Center point longitude
    - **radius**: Search radius in kilometers (default: 10km, max: 100km)
    - **issue_type**: Filter by specific issue type
    - **status**: Filter by issue status

    Returns minimal data for performance.
    """
    # Build query
    query = select(Issue)

    # Apply filters
    if issue_type:
        query = query.where(Issue.issue_type == issue_type)
    if status_filter:
        query = query.where(Issue.status == status_filter)

    # Get all issues (we'll filter by distance in Python for simplicity)
    # For production, use PostGIS for efficient geospatial queries
    all_issues = session.exec(query).all()

    # Filter by distance using Haversine formula
    def haversine_distance(lat1, lon1, lat2, lon2):
        """Calculate distance between two points in kilometers"""
        from math import asin, cos, radians, sin, sqrt

        R = 6371  # Earth's radius in kilometers

        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        c = 2 * asin(sqrt(a))

        return R * c

    nearby_issues = [
        issue
        for issue in all_issues
        if haversine_distance(latitude, longitude, issue.latitude, issue.longitude)
        <= radius
    ]

    return nearby_issues


@reports_router.get(
    "/{issue_id}",
    response_model=IssueResponse,
    summary="Get a specific issue report",
)
async def get_issue(
    issue_id: int,
    session: Session = Depends(get_session),
):
    """
    Get details of a specific issue report by ID.

    - **issue_id**: The ID of the issue to retrieve
    
    Returns full issue details including:
    - Issue photos (original report)
    - Completion description and photo (when PWD worker marks complete)
    """
    issue = session.get(Issue, issue_id)

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue with id {issue_id} not found",
        )

    # Build response with presigned URLs
    storage_service = get_storage_service()
    return build_issue_response(issue, storage_service, session)


# ==================== Localities (Public) ====================

from pydantic import BaseModel


class RepresentativeInfo(BaseModel):
    """Representative info for public view"""
    id: int
    name: str
    
    class Config:
        from_attributes = True


class LocalityPublicResponse(BaseModel):
    """Public locality response with representative info"""
    id: int
    name: str
    type: LocalityType
    representatives: list[RepresentativeInfo] = []
    
    class Config:
        from_attributes = True


class LocalityListPublicResponse(BaseModel):
    """List of localities for public view"""
    items: list[LocalityPublicResponse]
    total: int


@reports_router.get(
    "/localities/all",
    response_model=LocalityListPublicResponse,
    summary="Get all localities with their representatives",
)
async def get_all_localities(
    locality_type: Optional[LocalityType] = Query(None, alias="type", description="Filter by type (ward/village)"),
    search: Optional[str] = Query(None, description="Search by locality name"),
    session: Session = Depends(get_session),
):
    """
    Get a list of all active localities with their assigned representatives.
    
    **Public Endpoint**: No authentication required.
    
    - **type**: Filter by locality type (ward or village)
    - **search**: Search localities by name
    
    Returns locality info with list of representatives assigned to each.
    """
    query = select(Locality).where(Locality.is_active == True)
    
    if locality_type:
        query = query.where(Locality.type == locality_type)
    
    if search:
        query = query.where(Locality.name.contains(search))
    
    query = query.order_by(Locality.name)
    localities = session.exec(query).all()
    
    items = []
    for loc in localities:
        # Get representatives for this locality
        reps = session.exec(
            select(User).where(
                User.locality_id == loc.id,
                User.role == UserRole.REPRESENTATIVE,
                User.is_active == True
            )
        ).all()
        
        items.append(LocalityPublicResponse(
            id=loc.id,
            name=loc.name,
            type=loc.type,
            representatives=[
                RepresentativeInfo(id=r.id, name=r.name) for r in reps
            ]
        ))
    
    return LocalityListPublicResponse(
        items=items,
        total=len(items)
    )


@reports_router.get(
    "/localities/{locality_id}",
    response_model=LocalityPublicResponse,
    summary="Get locality details with representatives",
)
async def get_locality_details(
    locality_id: int,
    session: Session = Depends(get_session),
):
    """
    Get details of a specific locality including its representatives.
    
    **Public Endpoint**: No authentication required.
    """
    locality = session.get(Locality, locality_id)
    
    if not locality or not locality.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Locality not found"
        )
    
    # Get representatives for this locality
    reps = session.exec(
        select(User).where(
            User.locality_id == locality.id,
            User.role == UserRole.REPRESENTATIVE,
            User.is_active == True
        )
    ).all()
    
    return LocalityPublicResponse(
        id=locality.id,
        name=locality.name,
        type=locality.type,
        representatives=[
            RepresentativeInfo(id=r.id, name=r.name) for r in reps
        ]
    )
