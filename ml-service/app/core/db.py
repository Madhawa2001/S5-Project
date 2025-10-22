from prisma import Prisma
import asyncio

db = Prisma()

async def init_db(retries: int = 5, delay: int = 3):
    for attempt in range(retries):
        try:
            await db.connect()
            print("✅ Connected to PostgreSQL via Prisma")
            return
        except Exception as e:
            print(f"⚠️ Database connection attempt {attempt+1} failed: {e}")
            await asyncio.sleep(delay)
    raise RuntimeError("❌ Could not connect to PostgreSQL after multiple retries")

async def close_db():
    try:
        await db.disconnect()
        print("🔌 Database disconnected")
    except Exception as e:
        print(f"⚠️ Error closing database connection: {e}")
