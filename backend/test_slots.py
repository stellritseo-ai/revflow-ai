import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.scheduling.services.availability_engine import compute_availability
import sys
import uuid

async def main():
    engine = create_async_engine("postgresql+asyncpg://jitensony@localhost:5432/revflow")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    from sqlalchemy import text
    async with async_session() as db:
        res = await db.execute(text("SELECT id FROM clients LIMIT 1"))
        client_id = res.scalar()
        if not client_id:
            print("No clients found")
            return
            
        print(f"Client ID: {client_id}")
        try:
            slots = await compute_availability(
                client_id=str(client_id),
                db=db,
                duration_minutes=60,
            )
            print(f"Found {len(slots)} slots")
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
