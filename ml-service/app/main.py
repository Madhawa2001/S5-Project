from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from routes.predict import router as predict_router
from core.db import init_db, close_db
from dotenv import load_dotenv
import os

# Load env variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    try:
        yield
    finally:
        await close_db()

app = FastAPI(title="ML Prediction Service",lifespan=lifespan)

# Register routes
app.include_router(predict_router, prefix="/predict", tags=["Prediction"])
app.get("/health", tags=["Health"])(lambda: {"status": "ok"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("ML_HOST", "127.0.0.1"),
        port=int(os.getenv("ML_PORT", 8002)),
        reload=True
    )
