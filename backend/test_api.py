import asyncio
import httpx
import os

os.environ["NO_PROXY"] = "*"

async def run():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        # 1. Login
        login_res = await client.post("/api/v1/auth/login-dev", json={
            "email": "dev_user@example.com",
            "role": "clinic_owner"
        })
        if login_res.status_code != 200:
            print("Login failed:", login_res.text)
            return
            
        token = login_res.json()["access_token"]
        
        # 2. Fetch tenant profile
        profile_res = await client.get("/api/v1/tenant/profile", headers={
            "Authorization": f"Bearer {token}"
        })
        print("Tenant Profile Status:", profile_res.status_code)
        print("Tenant Profile Response:", profile_res.text)

asyncio.run(run())
