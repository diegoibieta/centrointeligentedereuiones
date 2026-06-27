from pydantic import BaseModel
from datetime import datetime


class ProjectBrief(BaseModel):
    id: str
    name: str

    model_config = {"from_attributes": True}


class PersonCreate(BaseModel):
    name: str
    role: str | None = None
    email: str | None = None
    company_id: str | None = None
    project_ids: list[str] = []


class PersonOut(BaseModel):
    id: str
    name: str
    role: str | None = None
    email: str | None = None
    company_id: str | None = None
    projects: list[ProjectBrief] = []
    created_at: datetime

    model_config = {"from_attributes": True}