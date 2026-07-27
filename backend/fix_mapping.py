import asyncio
from app.core.database import AsyncSessionLocal
from sqlalchemy import update
from app.models.models import Client

async def run():
    async with AsyncSessionLocal() as db:
        # 1. Clear phone numbers for ALL clients
        await db.execute(
            update(Client).values(phone_number=None)
        )
        
        # 2. Set the Twilio number ONLY for the Development Practice client
        dev_client_id = "a8d7b23d-57dd-4b86-bed3-c74618be99c1"
        await db.execute(
            update(Client)
            .where(Client.id == dev_client_id)
            .values(phone_number="+18335454689")
        )
        
        await db.commit()
        print("Successfully mapped the Twilio number exclusively to your Development Practice dashboard!")

if __name__ == "__main__":
    asyncio.run(run())
