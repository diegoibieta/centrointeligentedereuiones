from pydantic import BaseModel
from datetime import datetime
class PersonCreate(BaseModel):
    name: str
    role: str | None = None
    email: str | None = None
    company_id: str | None = None
class PersonOut(BaseModel):
    id: str
    name: str
    role: str | None
    email: str | None
    company_id: str | None
    created_at: datetime
    class Config:
        from_attributes = True
