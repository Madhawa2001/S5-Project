from prisma import Prisma

db = Prisma()

async def init_db():
    await db.connect()

async def close_db():
    await db.disconnect()
