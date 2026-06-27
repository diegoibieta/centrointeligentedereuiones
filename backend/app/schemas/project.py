from pydantic import BaseModel
from datetime import datetime


class PersonBrief(BaseModel):
    id: str
    name: str
    role: str | None = None

    class Config:
        from_attributes = True


class CompanyBrief(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    company_id: str | None = None
    person_ids: list[str] = []


class ProjectOut(BaseModel):
    id: str
    name: str
    description: str | None
    company_id: str | None
    company: CompanyBrief | None = None
    persons: list[PersonBrief] = []
    created_at: datetime

    class Config:
        from_attributes = True