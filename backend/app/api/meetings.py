import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from datetime import datetime

from ..core.database import get_db
from ..core.config import get_settings
from ..models.meeting import Meeting, MeetingStatus, MeetingModule
from ..models.tag import Tag
from ..schemas.meeting import MeetingCreate, MeetingOut, MeetingListOut
from ..tasks.process_meeting import process_meeting_task
from ..services.claude_service import semantic_search_query, answer_question

router = APIRouter(prefix="/meetings", tags=["meetings"])
settings = get_settings()

AUDIO_EXTENSIONS = {".mp3", ".mp4", ".wav", ".m4a", ".ogg", ".webm", ".flac", ".aac"}
TRANSCRIPT_EXTENSIONS = {".txt", ".pdf", ".docx"}
ALLOWED_EXTENSIONS = AUDIO_EXTENSIONS | TRANSCRIPT_EXTENSIONS


def extract_text_from_file(path: str, ext: str) -> str:
    if ext == ".txt":
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    elif ext == ".pdf":
        import PyPDF2
        text = []
        with open(path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text.append(page.extract_text() or "")
        return "\n".join(text)
    elif ext == ".docx":
        import docx
        doc = docx.Document(path)
        return "\n".join(p.text for p in doc.paragraphs)
    return ""


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
        raise HTTPException(400, f"Formato no soportado.")

    max_bytes = settings.max_upload_mb * 1024 * 1024
    meeting_id = str(uuid.uuid4())
    os.makedirs(settings.upload_dir, exist_ok=True)
    file_path = os.path.join(settings.upload_dir, f"{meeting_id}{ext}")

    total = 0
    async with aiofiles.open(file_path, "wb") as f:
        while chunk := await audio.read(1024 * 1024):
            total += len(chunk)
            if total > max_bytes:
                os.remove(file_path)
                raise HTTPException(413, "Archivo demasiado grande")
            await f.write(chunk)

    is_transcript = ext in TRANSCRIPT_EXTENSIONS
    pre_transcript = None
    if is_transcript:
        pre_transcript = extract_text_from_file(file_path, ext)

    tag_id_list = [t.strip() for t in tag_ids.split(",") if t.strip()]

    meeting = Meeting(
        id=meeting_id,
        title=title,
        date=datetime.fromisoformat(date),
        module=module,
        project_id=project_id or None,
        company_id=company_id or None,
        person_id=person_id or None,
        audio_path=file_path if not is_transcript else None,
        transcript_original=pre_transcript,
        transcript_spanish=pre_transcript,
        original_language="es",
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


@router.put("/{meeting_id}", response_model=MeetingOut)
async def update_meeting(
    meeting_id: str,
    title: str = Form(...),
    date: str = Form(...),
    module: MeetingModule = Form(...),
    project_id: str | None = Form(None),
    company_id: str | None = Form(None),
    person_id: str | None = Form(None),
    tag_ids: str = Form(""),
    db: AsyncSession = Depends(get_db),
):
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
    meeting.title = title
    meeting.date = datetime.fromisoformat(date)
    meeting.module = module
    meeting.project_id = project_id or None
    meeting.company_id = company_id or None
    meeting.person_id = person_id or None
    tag_id_list = [t.strip() for t in tag_ids.split(",") if t.strip()]
    if tag_id_list:
        tag_result = await db.execute(select(Tag).where(Tag.id.in_(tag_id_list)))
        meeting.tags = list(tag_result.scalars().all())
    else:
        meeting.tags = []
    await db.flush()
    await db.refresh(meeting, ["project", "company", "person", "tags"])
    return meeting


@router.post("/ask")
async def ask_meetings(
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    question = body.get("question", "").strip()
    if not question:
        raise HTTPException(400, "Pregunta vacia")

    result = await db.execute(
        select(Meeting).options(
            selectinload(Meeting.project),
            selectinload(Meeting.company),
            selectinload(Meeting.person),
        ).where(Meeting.status == MeetingStatus.completed)
    )
    all_meetings = result.scalars().all()

    meeting_dicts = [
        {"id": m.id, "title": m.title, "summary": m.summary}
        for m in all_meetings
    ]
    ranked_ids = semantic_search_query(question, meeting_dicts)
    id_to_meeting = {m.id: m for m in all_meetings}
    relevant = [id_to_meeting[mid] for mid in ranked_ids[:5] if mid in id_to_meeting]

    context = []
    for m in relevant:
        ctx = f"REUNION: {m.title} ({m.date.strftime('%d/%m/%Y')})"
        if m.company:
            ctx += f" | Empresa: {m.company.name}"
        if m.person:
            ctx += f" | Persona: {m.person.name}"
        if m.summary:
            ctx += f"\nResumen: {m.summary}"
        if m.agreements:
            ctx += "\nAcuerdos: " + "; ".join(a.get("description", "") for a in m.agreements)
        if m.tasks:
            ctx += "\nTareas: " + "; ".join(t.get("description", "") for t in m.tasks)
        if m.risks:
            ctx += "\nRiesgos: " + "; ".join(r.get("description", "") for r in m.risks)
        if m.opportunities:
            ctx += "\nOportunidades: " + "; ".join(o.get("description", "") for o in m.opportunities)
        context.append(ctx)

    answer = answer_question(question, context)

    sources = [
        {"id": m.id, "title": m.title, "date": m.date.isoformat()}
        for m in relevant
    ]
    return {"answer": answer, "sources": sources}


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

    meeting_dicts = [
        {"id": m.id, "title": m.title, "summary": m.summary}
        for m in all_meetings
    ]

    ranked_ids = semantic_search_query(q, meeting_dicts)

    id_to_meeting = {m.id: m for m in all_meetings}
    return [id_to_meeting[mid] for mid in ranked_ids if mid in id_to_meeting]


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