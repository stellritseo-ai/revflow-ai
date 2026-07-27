import asyncio
import os
os.environ.pop("http_proxy", None)
os.environ.pop("https_proxy", None)
os.environ.pop("HTTP_PROXY", None)
os.environ.pop("HTTPS_PROXY", None)
import httpx

async def test():
    async with httpx.AsyncClient() as client:
        resp = await client.post("http://localhost:8000/api/v1/calls/webhook/inbound", data={
            "CallSid": "CA12345",
            "From": "+1234567890",
            "To": "+12148380543",
            "CallStatus": "ringing"
        })
        print(f"Status: {resp.status_code}")
        print(f"Body: {resp.text}")

asyncio.run(test())
