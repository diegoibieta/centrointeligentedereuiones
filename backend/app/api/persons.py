from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from ..core.database import get_db
from ..models.person import Person
from ..models.project import Project
from ..schemas.person import PersonCreate, PersonOut

router = APIRouter(prefix="/persons", tags=["persons"])


async def _load(db: AsyncSession, person_id: str) -> Person:
    result = await db.execute(
        select(Person)
        .options(selectinload(Person.projects), selectinload(Person.company))
        .where(Person.id == person_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Persona no encontrada")
    return obj


@router.post("/", response_model=PersonOut)
async def create_person(data: PersonCreate, db: AsyncSession = Depends(get_db)):
    person = Person(name=data.name, role=data.role, email=data.email, company_id=data.company_id)
    if data.project_ids:
        res = await db.execute(select(Project).where(Project.id.in_(data.project_ids)))
        person.projects = list(res.scalars().all())
    db.add(person)
    await db.flush()
    return await _load(db, person.id)


@router.get("/", response_model=list[PersonOut])
async def list_persons(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Person)
        .options(selectinload(Person.projects), selectinload(Person.company))
        .order_by(Person.name)
    )
    return result.scalars().all()


@router.put("/{person_id}", response_model=PersonOut)
async def update_person(person_id: str, data: PersonCreate, db: AsyncSession = Depends(get_db)):
    obj = await _load(db, person_id)
    obj.name = data.name
    obj.role = data.role
    obj.email = data.email
    obj.company_id = data.company_id
    if data.project_ids is not None:
        res = await db.execute(select(Project).where(Project.id.in_(data.project_ids)))
        obj.projects = list(res.scalars().all())
    else:
        obj.projects = []
    await db.flush()
    return await _load(db, person_id)


@router.delete("/{person_id}")
async def delete_person(person_id: str, db: AsyncSession = Depends(get_db)):
    obj = await _load(db, person_id)
    await db.delete(obj)
    return {"ok": True}