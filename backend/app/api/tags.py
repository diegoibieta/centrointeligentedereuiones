from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..core.database import get_db
from ..models.tag import Tag
from ..schemas.tag import TagCreate, TagOut
router = APIRouter(prefix="/tags", tags=["tags"])
@router.post("/", response_model=TagOut)
async def create_tag(data: TagCreate, db: AsyncSession = Depends(get_db)):
    tag = Tag(**data.model_dump())
    db.add(tag)
    await db.flush()
    await db.refresh(tag)
    return tag
@router.get("/", response_model=list[TagOut])
async def list_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tag).order_by(Tag.name))
    return result.scalars().all()
