from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, field_validator
from datetime import datetime, timezone
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scheduling", tags=["scheduling"])


# ── Request / Response schemas ──────────────────────────────────────────────

class CalendarEventCreate(BaseModel):
    title: str
    start: datetime
    duration_minutes: int = 60
    description: str = ""
    attendees: list[str] = []
    location: str = ""
    add_meet_link: bool = True

    @field_validator("start", mode="before")
    @classmethod
    def ensure_tz(cls, v):
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    start: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    description: Optional[str] = None
    attendees: Optional[list[str]] = None
    location: Optional[str] = None

    @field_validator("start", mode="before")
    @classmethod
    def ensure_tz(cls, v):
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v


class SyncMeetingToCalendarRequest(BaseModel):
    duration_minutes: int = 60
    attendees: list[str] = []
    add_meet_link: bool = True


# ── Helpers ──────────────────────────────────────────────────────────────────

def _calendar_unavailable(exc: Exception) -> HTTPException:
    msg = str(exc)
    if "No Google credentials" in msg or "not installed" in msg:
        return HTTPException(503, detail=f"Google Calendar no configurado: {msg}")
    return HTTPException(502, detail=f"Error de Google Calendar: {msg}")


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/calendar/events", status_code=201)
async def create_event(body: CalendarEventCreate):
    """Create a new Google Calendar event."""
    try:
        from ..services.google_calendar_service import create_calendar_event
        event = create_calendar_event(
            title=body.title,
            start=body.start,
            duration_minutes=body.duration_minutes,
            description=body.description,
            attendees=body.attendees or None,
            location=body.location,
            add_meet_link=body.add_meet_link,
        )
        return _format_event(event)
    except Exception as exc:
        logger.exception("Failed to create calendar event")
        raise _calendar_unavailable(exc)


@router.get("/calendar/events")
async def list_events(
    max_results: int = Query(20, ge=1, le=250),
    time_min: Optional[datetime] = Query(None),
    time_max: Optional[datetime] = Query(None),
    query: str = Query(""),
):
    """List upcoming Google Calendar events."""
    try:
        from ..services.google_calendar_service import list_calendar_events
        events = list_calendar_events(
            max_results=max_results,
            time_min=time_min,
            time_max=time_max,
            query=query,
        )
        return [_format_event(e) for e in events]
    except Exception as exc:
        logger.exception("Failed to list calendar events")
        raise _calendar_unavailable(exc)


@router.get("/calendar/events/{event_id}")
async def get_event(event_id: str):
    """Get a single Google Calendar event."""
    try:
        from ..services.google_calendar_service import get_calendar_event
        event = get_calendar_event(event_id)
        return _format_event(event)
    except Exception as exc:
        logger.exception("Failed to get calendar event %s", event_id)
        raise _calendar_unavailable(exc)


@router.patch("/calendar/events/{event_id}")
async def update_event(event_id: str, body: CalendarEventUpdate):
    """Update an existing Google Calendar event."""
    try:
        from ..services.google_calendar_service import update_calendar_event
        event = update_calendar_event(
            event_id=event_id,
            title=body.title,
            start=body.start,
            duration_minutes=body.duration_minutes,
            description=body.description,
            attendees=body.attendees,
            location=body.location,
        )
        return _format_event(event)
    except Exception as exc:
        logger.exception("Failed to update calendar event %s", event_id)
        raise _calendar_unavailable(exc)


@router.delete("/calendar/events/{event_id}", status_code=204)
async def delete_event(event_id: str):
    """Delete a Google Calendar event."""
    try:
        from ..services.google_calendar_service import delete_calendar_event
        delete_calendar_event(event_id)
    except Exception as exc:
        logger.exception("Failed to delete calendar event %s", event_id)
        raise _calendar_unavailable(exc)


@router.post("/meetings/{meeting_id}/sync-calendar", status_code=201)
async def sync_meeting_to_calendar(meeting_id: str, body: SyncMeetingToCalendarRequest):
    """
    Create a Google Calendar event from an existing meeting record.
    Returns the created calendar event and updates the meeting's calendar_event_id if the
    column exists.
    """
    from ..core.database import get_db
    from ..models.meeting import Meeting
    from sqlalchemy import select

    async for db in get_db():
        result = await db.execute(select(Meeting).where(Meeting.id == meeting_id))
        meeting = result.scalar_one_or_none()
        if not meeting:
            raise HTTPException(404, "Reunión no encontrada")

        description_parts = []
        if meeting.summary:
            description_parts.append(f"Resumen: {meeting.summary}")
        if meeting.module:
            description_parts.append(f"Módulo: {meeting.module.value}")
        description = "\n\n".join(description_parts)

        try:
            from ..services.google_calendar_service import create_calendar_event
            event = create_calendar_event(
                title=meeting.title,
                start=meeting.date if hasattr(meeting.date, "tzinfo") else datetime.fromisoformat(str(meeting.date)).replace(tzinfo=timezone.utc),
                duration_minutes=body.duration_minutes,
                description=description,
                attendees=body.attendees or None,
                add_meet_link=body.add_meet_link,
            )
        except Exception as exc:
            logger.exception("Failed to sync meeting %s to calendar", meeting_id)
            raise _calendar_unavailable(exc)

        # Store the calendar event ID on the meeting if the column exists
        if hasattr(meeting, "calendar_event_id"):
            meeting.calendar_event_id = event.get("id")
            await db.flush()

        return {
            "meeting_id": meeting_id,
            "calendar_event": _format_event(event),
        }


# ── Formatting helper ────────────────────────────────────────────────────────

def _format_event(event: dict) -> dict:
    """Normalize a raw Google Calendar event into a consistent API response."""
    start_raw = event.get("start", {})
    end_raw = event.get("end", {})

    meet_link = None
    conf = event.get("conferenceData", {})
    for ep in conf.get("entryPoints", []):
        if ep.get("entryPointType") == "video":
            meet_link = ep.get("uri")
            break

    attendees = [
        {"email": a.get("email"), "name": a.get("displayName"), "status": a.get("responseStatus")}
        for a in event.get("attendees", [])
    ]

    return {
        "id": event.get("id"),
        "title": event.get("summary"),
        "description": event.get("description"),
        "location": event.get("location"),
        "start": start_raw.get("dateTime") or start_raw.get("date"),
        "end": end_raw.get("dateTime") or end_raw.get("date"),
        "meet_link": meet_link,
        "attendees": attendees,
        "html_link": event.get("htmlLink"),
        "status": event.get("status"),
        "created": event.get("created"),
        "updated": event.get("updated"),
    }
