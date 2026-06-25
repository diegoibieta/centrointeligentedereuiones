from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..core.database import get_db
from ..models.company import Company
from ..schemas.company import CompanyCreate, CompanyOut

router = APIRouter(prefix="/companies", tags=["companies"])


@router.post("/", response_model=CompanyOut)
async def create_company(data: CompanyCreate, db: AsyncSession = Depends(get_db)):
    company = Company(**data.model_dump())
    db.add(company)
    await db.flush()
    await db.refresh(company)
    return company


@router.get("/", response_model=list[CompanyOut])
async def list_companies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Company).order_by(Company.name))
    return result.scalars().all()


@router.put("/{company_id}", response_model=CompanyOut)
async def update_company(company_id: str, data: CompanyCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Company).where(Company.id == company_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Empresa no encontrada")
    obj.name = data.name
    obj.sector = data.sector
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/{company_id}")
async def delete_company(company_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Company).where(Company.id == company_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Empresa no encontrada")
    await db.delete(obj)
    return {"ok": True}
