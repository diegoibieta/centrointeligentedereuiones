from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .celery_app import celery_app
from ..core.config import get_settings
from ..models.meeting import Meeting, MeetingStatus
from ..services.transcription import transcribe
from ..services.claude_service import translate_to_spanish, analyze_meeting

settings = get_settings()
SyncEngine = create_engine(settings.sync_database_url)
SyncSession = sessionmaker(bind=SyncEngine)


def _get_session():
    return SyncSession()


@celery_app.task(bind=True, max_retries=3)
def process_meeting_task(self, meeting_id: str, chat_id: str | None = None):
    session = _get_session()
    try:
        meeting = session.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            return

        if meeting.transcript_spanish:
            meeting.status = MeetingStatus.analyzing
            session.commit()
            transcript_for_analysis = meeting.transcript_spanish
        else:
            meeting.status = MeetingStatus.transcribing
            session.commit()

            transcript, lang, duration = transcribe(meeting.audio_path)
            meeting.transcript_original = transcript
            meeting.original_language = lang
            meeting.duration_seconds = duration

            meeting.status = MeetingStatus.analyzing
            session.commit()

            translated = translate_to_spanish(transcript, lang)
            meeting.transcript_spanish = translated
            transcript_for_analysis = translated

        analysis = analyze_meeting(transcript_for_analysis, meeting.title, meeting.module.value)
        meeting.summary = analysis.get("summary", "")
        meeting.agreements = analysis.get("agreements", [])
        meeting.tasks = analysis.get("tasks", [])
        meeting.risks = analysis.get("risks", [])
        meeting.opportunities = analysis.get("opportunities", [])

        meeting.status = MeetingStatus.completed
        session.commit()

    except Exception as exc:
        session.rollback()
        meeting = session.query(Meeting).filter(Meeting.id == meeting_id).first()
        if meeting:
            meeting.status = MeetingStatus.error
            meeting.error_message = str(exc)
            session.commit()
        raise self.retry(exc=exc, countdown=60)
    finally:
        session.close()
