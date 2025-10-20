from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from routes.predict import router as predict_router
from core.db import init_db, close_db
from dotenv import load_dotenv
import os

# Load env variables
load_dotenv()

async def ensure_prisma_binary():
    """Ensure Prisma query engine binary exists in Railway runtime."""
    print("Checking Prisma binary...")
    result = os.system("prisma py fetch --binary-target debian-openssl-3.0.x")
    if result == 0:
        print("✅ Prisma binary fetched successfully.")
    else:
        print("⚠️ Failed to fetch Prisma binary, check logs.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_prisma_binary()
    await init_db()
    try:
        yield
    finally:
        await close_db()

app = FastAPI(title="ML Prediction Service",lifespan=lifespan)

# Register routes
app.include_router(predict_router, prefix="/predict", tags=["Prediction"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("ML_HOST", "127.0.0.1"),
        port=int(os.getenv("ML_PORT", 8002)),
        reload=True
    )
