from sqlalchemy import String, Table, Column, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from ..core.database import Base
import uuid
meeting_tags = Table(
    "meeting_tags",
    Base.metadata,
    Column("meeting_id", String(36), ForeignKey("meetings.id"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("tags.id"), primary_key=True),
)
class Tag(Base):
    __tablename__ = "tags"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    color: Mapped[str] = mapped_column(String(7), default="#6366f1")
    meetings: Mapped[list["Meeting"]] = relationship("Meeting", secondary=meeting_tags, back_populates="tags")
