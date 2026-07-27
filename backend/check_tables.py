import asyncio
from sqlalchemy import text
from app.core.database import engine

async def check_tables():
    async with engine.begin() as conn:
        result = await conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
        ))
        tables = [row[0] for row in result.fetchall()]
        print("Tables in DB:", tables)

asyncio.run(check_tables())
