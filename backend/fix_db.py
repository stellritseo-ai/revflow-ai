import asyncio
from sqlalchemy import text
from app.core.database import engine

async def main():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE appointments ADD COLUMN ai_session_id UUID;"))
            print("Successfully added ai_session_id to appointments.")
        except Exception as e:
            print(f"Error: {e}")

asyncio.run(main())
