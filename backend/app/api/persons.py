from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..core.database import get_db
from ..models.person import Person
from ..schemas.person import PersonCreate, PersonOut

router = APIRouter(prefix="/persons", tags=["persons"])


@router.post("/", response_model=PersonOut)
async def create_person(data: PersonCreate, db: AsyncSession = Depends(get_db)):
    person = Person(**data.model_dump())
    db.add(person)
    await db.flush()
    await db.refresh(person)
    return person


@router.get("/", response_model=list[PersonOut])
async def list_persons(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Person).order_by(Person.name))
    return result.scalars().all()


@router.put("/{person_id}", response_model=PersonOut)
async def update_person(person_id: str, data: PersonCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Person).where(Person.id == person_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Persona no encontrada")
    obj.name = data.name
    obj.role = data.role
    obj.email = data.email
    obj.company_id = data.company_id
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{person_id}")
async def delete_person(person_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Person).where(Person.id == person_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Persona no encontrada")
    await db.delete(obj)
    return {"ok": True}
