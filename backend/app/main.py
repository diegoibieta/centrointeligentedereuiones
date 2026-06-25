from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import meetings, projects, companies, persons, tags
from .core.database import engine, Base
app = FastAPI(
    title="Centro de Inteligencia de Reuniones",
    version="1.0.0",
    description="Plataforma privada de analisis estrategico de reuniones",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(meetings.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(companies.router, prefix="/api/v1")
app.include_router(persons.router, prefix="/api/v1")
app.include_router(tags.router, prefix="/api/v1")
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
@app.get("/health")
async def health():
    return {"status": "ok"}
