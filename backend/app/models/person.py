from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from ..core.database import Base
import uuid
class Person(Base):
    __tablename__ = "persons"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str | None] = mapped_column(String(100))
    email: Mapped[str | None] = mapped_column(String(255))
    company_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("companies.id"))
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    company: Mapped["Company | None"] = relationship("Company", back_populates="persons")
    meetings: Mapped[list["Meeting"]] = relationship("Meeting", back_populates="person")
