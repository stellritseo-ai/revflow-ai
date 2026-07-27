import asyncio
import websockets
import json
import os
os.environ.pop("http_proxy", None)
os.environ.pop("https_proxy", None)
os.environ.pop("HTTP_PROXY", None)
os.environ.pop("HTTPS_PROXY", None)
from dotenv import load_dotenv

load_dotenv()

async def test_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    gemini_url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={api_key}"
    
    try:
        print("Connecting to Gemini...")
        async with websockets.connect(gemini_url) as ws:
            print("Connected!")
            setup_msg = {
                "setup": {
                    "model": "models/gemini-2.0-flash-exp",
                    "systemInstruction": {
                        "parts": [{"text": "Hello"}]
                    }
                }
            }
            await ws.send(json.dumps(setup_msg))
            resp = await ws.recv()
            print("Response:", resp)
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_gemini())
