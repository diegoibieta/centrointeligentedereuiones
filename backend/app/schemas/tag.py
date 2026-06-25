from pydantic import BaseModel
class TagCreate(BaseModel):
    name: str
    color: str = "#6366f1"
class TagOut(BaseModel):
    id: str
    name: str
    color: str
    class Config:
        from_attributes = True
