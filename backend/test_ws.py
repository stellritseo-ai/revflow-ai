import asyncio
import websockets
async def test():
    try:
        async with websockets.connect("ws://localhost:8000/api/v1/calls/media-stream?client_id=123") as ws:
            print("Connected!")
    except Exception as e:
        print(f"Error: {e}")
asyncio.run(test())
