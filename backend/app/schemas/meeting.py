from pydantic import BaseModel
from datetime import datetime
from typing import Any
from ..models.meeting import MeetingStatus, MeetingModule
class MeetingCreate(BaseModel):
    title: str
    date: datetime
    module: MeetingModule
    project_id: str | None = None
    company_id: str | None = None
    person_id: str | None = None
    tag_ids: list[str] = []
class TagOut(BaseModel):
    id: str
    name: str
    color: str
    class Config:
        from_attributes = True
class ProjectOut(BaseModel):
    id: str
    name: str
    class Config:
        from_attributes = True
class CompanyOut(BaseModel):
    id: str
    name: str
    class Config:
        from_attributes = True
class PersonOut(BaseModel):
    id: str
    name: str
    role: str | None
    class Config:
        from_attributes = True
class MeetingOut(BaseModel):
    id: str
    title: str
    date: datetime
    module: MeetingModule
    status: MeetingStatus
    original_language: str | None
    duration_seconds: float | None
    transcript_original: str | None
    transcript_spanish: str | None
    summary: str | None
    agreements: list[Any] | None
    tasks: list[Any] | None
    risks: list[Any] | None
    opportunities: list[Any] | None
    created_at: datetime
    project: ProjectOut | None
    company: CompanyOut | None
    person: PersonOut | None
    tags: list[TagOut] = []
    error_message: str | None
    class Config:
        from_attributes = True
class MeetingListOut(BaseModel):
    id: str
    title: str
    date: datetime
    module: MeetingModule
    status: MeetingStatus
    duration_seconds: float | None
    summary: str | None
    project: ProjectOut | None
    company: CompanyOut | None
    person: PersonOut | None
    tags: list[TagOut] = []
    class Config:
        from_attributes = True
