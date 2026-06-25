import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from ..core.database import get_db
from ..core.config import get_settings
from ..models.meeting import Meeting, MeetingStatus, MeetingModule
from ..models.tag import Tag
from ..schemas.meeting import MeetingOut, MeetingListOut
from ..tasks.process_meeting import process_meeting_task
from ..services.claude_service import semantic_search_query
router = APIRouter(prefix="/meetings", tags=["meetings"])
settings = get_settings()
ALLOWED_EXTENSIONS = {".mp3", ".mp4", ".wav", ".m4a", ".ogg", ".webm", ".flac", ".aac"}
@router.post("/upload", response_model=MeetingOut)
async def upload_meeting(
    title: str = Form(...),
    date: str = Form(...),
    module: MeetingModule = Form(...),
    project_id: str | None = Form(None),
    company_id: str | None = Form(None),
    person_id: str | None = Form(None),
    tag_ids: str = Form(""),
    audio: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    ext = os.path.splitext(audio.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Formato no soportado. Usa: {', '.join(ALLOWED_EXTENSIONS)}")
    max_bytes = settings.max_upload_mb * 1024 * 1024
    meeting_id = str(uuid.uuid4())
    os.makedirs(settings.upload_dir, exist_ok=True)
    audio_path = os.path.join(settings.upload_dir, f"{meeting_id}{ext}")
    total = 0
    async with aiofiles.open(audio_path, "wb") as f:
        while chunk := await audio.read(1024 * 1024):
            total += len(chunk)
            if total > max_bytes:
                os.remove(audio_path)
                raise HTTPException(413, "Archivo demasiado grande")
            await f.write(chunk)
    tag_id_list = [t.strip() for t in tag_ids.split(",") if t.strip()]
    meeting = Meeting(
        id=meeting_id,
        title=title,
        date=datetime.fromisoformat(date),
        module=module,
        project_id=project_id or None,
        company_id=company_id or None,
        person_id=person_id or None,
        audio_path=audio_path,
        status=MeetingStatus.pending,
    )
    if tag_id_list:
        result = await db.execute(select(Tag).where(Tag.id.in_(tag_id_list)))
        meeting.tags = result.scalars().all()
    db.add(meeting)
    await db.flush()
    await db.refresh(meeting, ["project", "company", "person", "tags"])
    process_meeting_task.delay(meeting_id)
    return meeting
@router.get("/search", response_model=list[MeetingListOut])
async def search_meetings(
    q: str = Query(..., min_length=2),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Meeting).options(
            selectinload(Meeting.project),
            selectinload(Meeting.company),
            selectinload(Meeting.person),
            selectinload(Meeting.tags),
        ).where(Meeting.status == MeetingStatus.completed)
    )
    all_meetings = result.scalars().all()
    meeting_dicts = [{"id": m.id, "title": m.title, "summary": m.summary} for m in all_meetings]
    ranked_ids = semantic_search_query(q, meeting_dicts)
    id_to_meeting = {m.id: m for m in all_meetings}
    return [id_to_meeting[mid] for mid in ranked_ids if mid in id_to_meeting]
@router.get("/", response_model=list[MeetingListOut])
async def list_meetings(
    module: MeetingModule | None = Query(None),
    project_id: str | None = Query(None),
    company_id: str | None = Query(None),
    status: MeetingStatus | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Meeting).options(
        selectinload(Meeting.project),
        selectinload(Meeting.company),
        selectinload(Meeting.person),
        selectinload(Meeting.tags),
    ).order_by(Meeting.date.desc())
    if module:
        q = q.where(Meeting.module == module)
    if project_id:
        q = q.where(Meeting.project_id == project_id)
    if company_id:
        q = q.where(Meeting.company_id == company_id)
    if status:
        q = q.where(Meeting.status == status)
    result = await db.execute(q)
    return result.scalars().all()
@router.get("/{meeting_id}", response_model=MeetingOut)
async def get_meeting(meeting_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Meeting).options(
            selectinload(Meeting.project),
            selectinload(Meeting.company),
            selectinload(Meeting.person),
            selectinload(Meeting.tags),
        ).where(Meeting.id == meeting_id)
    )
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(404, "Reunion no encontrada")
    return meeting
@router.delete("/{meeting_id}")
async def delete_meeting(meeting_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Meeting).where(Meeting.id == meeting_id))
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(404, "Reunion no encontrada")
    if meeting.audio_path and os.path.exists(meeting.audio_path):
        os.remove(meeting.audio_path)
    await db.delete(meeting)
    return {"ok": True}
