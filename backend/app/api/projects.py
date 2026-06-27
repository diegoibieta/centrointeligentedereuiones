from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from ..core.database import get_db
from ..models.project import Project
from ..models.person import Person
from ..schemas.project import ProjectCreate, ProjectOut

router = APIRouter(prefix="/projects", tags=["projects"])


async def _load(db: AsyncSession, project_id: str) -> Project:
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.company), selectinload(Project.persons))
        .where(Project.id == project_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Proyecto no encontrado")
    return obj


@router.post("/", response_model=ProjectOut)
async def create_project(data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(name=data.name, description=data.description, company_id=data.company_id)
    if data.person_ids:
        res = await db.execute(select(Person).where(Person.id.in_(data.person_ids)))
        project.persons = list(res.scalars().all())
    db.add(project)
    await db.flush()
    return await _load(db, project.id)


@router.get("/", response_model=list[ProjectOut])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.company), selectinload(Project.persons))
        .order_by(Project.name)
    )
    return result.scalars().all()


@router.put("/{project_id}", response_model=ProjectOut)
async def update_project(project_id: str, data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    obj = await _load(db, project_id)
    obj.name = data.name
    obj.description = data.description
    obj.company_id = data.company_id
    if data.person_ids is not None:
        res = await db.execute(select(Person).where(Person.id.in_(data.person_ids)))
        obj.persons = list(res.scalars().all())
    else:
        obj.persons = []
    await db.flush()
    return await _load(db, project_id)


@router.delete("/{project_id}")
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db)):
    obj = await _load(db, project_id)
    await db.delete(obj)
    return {"ok": True}