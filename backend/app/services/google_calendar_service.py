import os
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

logger = logging.getLogger(__name__)


def _get_calendar_service():
    """Build and return a Google Calendar API service client."""
    try:
        from googleapiclient.discovery import build
        from google.oauth2 import service_account
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
    except ImportError:
        raise RuntimeError(
            "Google API client libraries are not installed. "
            "Add google-api-python-client and google-auth to requirements."
        )

    SCOPES = ["https://www.googleapis.com/auth/calendar"]

    # Prefer service account credentials (server-side usage)
    service_account_file = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE")
    service_account_info = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")

    if service_account_file and os.path.exists(service_account_file):
        creds = service_account.Credentials.from_service_account_file(
            service_account_file, scopes=SCOPES
        )
        return build("calendar", "v3", credentials=creds, cache_discovery=False)

    if service_account_info:
        info = json.loads(service_account_info)
        creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
        return build("calendar", "v3", credentials=creds, cache_discovery=False)

    # Fall back to OAuth2 token file (for local/dev usage)
    token_file = os.getenv("GOOGLE_TOKEN_FILE", "token.json")
    credentials_file = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")

    creds = None
    if os.path.exists(token_file):
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(token_file, "w") as f:
                f.write(creds.to_json())
        elif os.path.exists(credentials_file):
            from google_auth_oauthlib.flow import InstalledAppFlow
            flow = InstalledAppFlow.from_client_secrets_file(credentials_file, SCOPES)
            creds = flow.run_local_server(port=0)
            with open(token_file, "w") as f:
                f.write(creds.to_json())
        else:
            raise RuntimeError(
                "No Google credentials found. Set GOOGLE_SERVICE_ACCOUNT_FILE, "
                "GOOGLE_SERVICE_ACCOUNT_JSON, or provide credentials.json for OAuth2."
            )

    return build("calendar", "v3", credentials=creds, cache_discovery=False)


def _calendar_id() -> str:
    return os.getenv("GOOGLE_CALENDAR_ID", "primary")


def create_calendar_event(
    title: str,
    start: datetime,
    duration_minutes: int = 60,
    description: str = "",
    attendees: list[str] | None = None,
    location: str = "",
    add_meet_link: bool = True,
) -> dict:
    """Create a Google Calendar event and return the created event dict."""
    service = _get_calendar_service()

    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    end = start + timedelta(minutes=duration_minutes)

    event_body: dict = {
        "summary": title,
        "description": description,
        "location": location,
        "start": {"dateTime": start.isoformat(), "timeZone": "UTC"},
        "end": {"dateTime": end.isoformat(), "timeZone": "UTC"},
    }

    if attendees:
        event_body["attendees"] = [{"email": e} for e in attendees]

    if add_meet_link:
        import uuid as _uuid
        event_body["conferenceData"] = {
            "createRequest": {
                "requestId": str(_uuid.uuid4()),
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        }

    kwargs: dict = {"calendarId": _calendar_id(), "body": event_body, "sendUpdates": "all"}
    if add_meet_link:
        kwargs["conferenceDataVersion"] = 1

    created = service.events().insert(**kwargs).execute()
    logger.info("Created calendar event %s: %s", created.get("id"), title)
    return created


def get_calendar_event(event_id: str) -> dict:
    service = _get_calendar_service()
    return service.events().get(calendarId=_calendar_id(), eventId=event_id).execute()


def list_calendar_events(
    max_results: int = 20,
    time_min: Optional[datetime] = None,
    time_max: Optional[datetime] = None,
    query: str = "",
) -> list[dict]:
    """Return upcoming calendar events ordered by start time."""
    service = _get_calendar_service()

    if time_min is None:
        time_min = datetime.now(timezone.utc)
    if time_min.tzinfo is None:
        time_min = time_min.replace(tzinfo=timezone.utc)

    params: dict = {
        "calendarId": _calendar_id(),
        "maxResults": min(max_results, 250),
        "singleEvents": True,
        "orderBy": "startTime",
        "timeMin": time_min.isoformat(),
    }
    if time_max:
        if time_max.tzinfo is None:
            time_max = time_max.replace(tzinfo=timezone.utc)
        params["timeMax"] = time_max.isoformat()
    if query:
        params["q"] = query

    result = service.events().list(**params).execute()
    return result.get("items", [])


def update_calendar_event(
    event_id: str,
    title: str | None = None,
    start: datetime | None = None,
    duration_minutes: int | None = None,
    description: str | None = None,
    attendees: list[str] | None = None,
    location: str | None = None,
) -> dict:
    """Patch an existing calendar event with the provided fields."""
    service = _get_calendar_service()
    existing = service.events().get(calendarId=_calendar_id(), eventId=event_id).execute()

    patch: dict = {}
    if title is not None:
        patch["summary"] = title
    if description is not None:
        patch["description"] = description
    if location is not None:
        patch["location"] = location
    if attendees is not None:
        patch["attendees"] = [{"email": e} for e in attendees]

    if start is not None:
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        # Preserve existing duration if not overriding
        if duration_minutes is None:
            try:
                existing_start = datetime.fromisoformat(existing["start"]["dateTime"])
                existing_end = datetime.fromisoformat(existing["end"]["dateTime"])
                duration_minutes = int((existing_end - existing_start).total_seconds() / 60)
            except Exception:
                duration_minutes = 60
        end = start + timedelta(minutes=duration_minutes)
        patch["start"] = {"dateTime": start.isoformat(), "timeZone": "UTC"}
        patch["end"] = {"dateTime": end.isoformat(), "timeZone": "UTC"}
    elif duration_minutes is not None:
        try:
            existing_start = datetime.fromisoformat(existing["start"]["dateTime"])
            if existing_start.tzinfo is None:
                existing_start = existing_start.replace(tzinfo=timezone.utc)
        except Exception:
            existing_start = datetime.now(timezone.utc)
        end = existing_start + timedelta(minutes=duration_minutes)
        patch["end"] = {"dateTime": end.isoformat(), "timeZone": "UTC"}

    updated = service.events().patch(
        calendarId=_calendar_id(), eventId=event_id, body=patch, sendUpdates="all"
    ).execute()
    logger.info("Updated calendar event %s", event_id)
    return updated


def delete_calendar_event(event_id: str) -> None:
    """Delete a calendar event by its ID."""
    service = _get_calendar_service()
    service.events().delete(
        calendarId=_calendar_id(), eventId=event_id, sendUpdates="all"
    ).execute()
    logger.info("Deleted calendar event %s", event_id)
