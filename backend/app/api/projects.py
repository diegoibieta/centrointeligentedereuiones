from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..core.database import get_db
from ..models.project import Project
from ..schemas.project import ProjectCreate, ProjectOut

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/", response_model=ProjectOut)
async def create_project(data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(**data.model_dump())
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return project


@router.get("/", response_model=list[ProjectOut])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).order_by(Project.name))
    return result.scalars().all()


@router.put("/{project_id}", response_model=ProjectOut)
async def update_project(project_id: str, data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Proyecto no encontrado")
    obj.name = data.name
    obj.description = data.description
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{project_id}")
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Proyecto no encontrado")
    await db.delete(obj)
    return {"ok": True}
