import asyncio
from app.core.database import AsyncSessionLocal
from sqlalchemy import select, update
from app.models.models import Client

async def run():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Client))
        clients = res.scalars().all()
        print(f"Found {len(clients)} clients.")
        
        # Update all clients to match the Twilio number
        await db.execute(
            update(Client).values(phone_number="+18335454689")
        )
        await db.commit()
        print("Updated all clients to +18335454689 so Twilio webhooks map correctly!")

asyncio.run(run())
