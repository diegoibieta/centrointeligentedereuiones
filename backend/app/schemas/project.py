from pydantic import BaseModel
from datetime import datetime
class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
class ProjectOut(BaseModel):
    id: str
    name: str
    description: str | None
    created_at: datetime
    class Config:
        from_attributes = True
