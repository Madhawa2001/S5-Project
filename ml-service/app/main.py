from fastapi import FastAPI
from app.core.db import init_db, close_db
from app.routers import hormone
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    try:
        yield
    finally:
        await close_db()

app = FastAPI(title="ML Service with Prisma DB", lifespan=lifespan)

# Register routers
app.include_router(hormone.router)

@app.get("/health")
def health():
    return {"status": "ok"}
