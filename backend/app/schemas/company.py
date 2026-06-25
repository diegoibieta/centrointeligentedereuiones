from pydantic import BaseModel
from datetime import datetime
class CompanyCreate(BaseModel):
    name: str
    sector: str | None = None
    notes: str | None = None
class CompanyOut(BaseModel):
    id: str
    name: str
    sector: str | None
    notes: str | None
    created_at: datetime
    class Config:
        from_attributes = True
