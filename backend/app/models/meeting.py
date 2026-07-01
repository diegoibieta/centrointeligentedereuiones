import uuid
import enum
from sqlalchemy import String, Text, ForeignKey, DateTime, Enum, JSON, Float, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from ..core.database import Base
from .tag import meeting_tags

meeting_persons = Table(
    "meeting_persons",
    Base.metadata,
    Column("meeting_id", String(36), ForeignKey("meetings.id"), primary_key=True),
    Column("person_id", String(36), ForeignKey("persons.id"), primary_key=True),
)

class MeetingStatus(str, enum.Enum):
    pending = "pending"
    transcribing = "transcribing"
    analyzing = "analyzing"
    completed = "completed"
    error = "error"
class MeetingModule(str, enum.Enum):
    investors = "investors"
    clients = "clients"
    suppliers = "suppliers"
    internal = "internal"
class Meeting(Base):
    __tablename__ = "meetings"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    date: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False)
    module: Mapped[MeetingModule] = mapped_column(Enum(MeetingModule), nullable=False)
    status: Mapped[MeetingStatus] = mapped_column(Enum(MeetingStatus), default=MeetingStatus.pending)
    original_language: Mapped[str | None] = mapped_column(String(10))
    audio_path: Mapped[str | None] = mapped_column(String(500))
    duration_seconds: Mapped[float | None] = mapped_column(Float)
    project_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("projects.id"))
    company_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("companies.id"))
    person_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("persons.id"))
    transcript_original: Mapped[str | None] = mapped_column(Text)
    transcript_spanish: Mapped[str | None] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text)
    agreements: Mapped[list | None] = mapped_column(JSON)
    tasks: Mapped[list | None] = mapped_column(JSON)
    risks: Mapped[list | None] = mapped_column(JSON)
    opportunities: Mapped[list | None] = mapped_column(JSON)
    embedding: Mapped[list | None] = mapped_column(Vector(1536))
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    error_message: Mapped[str | None] = mapped_column(Text)
    project: Mapped["Project | None"] = relationship("Project", back_populates="meetings")
    company: Mapped["Company | None"] = relationship("Company", back_populates="meetings")
    person: Mapped["Person | None"] = relationship("Person", back_populates="meetings", foreign_keys=[person_id])
    persons: Mapped[list["Person"]] = relationship("Person", secondary=meeting_persons, back_populates="meeting_list")
    tags: Mapped[list["Tag"]] = relationship("Tag", secondary=meeting_tags, back_populates="meetings")