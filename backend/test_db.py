import asyncio
from app.core.database import AsyncSessionLocal
from sqlalchemy import select
from app.models.models import Client

async def run():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Client))
        clients = res.scalars().all()
        print(f"Found {len(clients)} clients.")
        for c in clients:
            print(f"Client: {c.name}, Phone: {c.phone_number}")

asyncio.run(run())
