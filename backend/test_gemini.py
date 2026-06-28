import os
import httpx
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GEMINI_API_KEY")
print("Key loaded:", bool(key))

if not key:
    raise SystemExit("GEMINI_API_KEY not set in .env")

BASE = "https://generativelanguage.googleapis.com/v1beta/models"
MODEL = "gemini-2.0-flash-lite"
url = f"{BASE}/{MODEL}:generateContent?key={key}"
payload = {
    "systemInstruction": {"parts": [{"text": "You are a helpful assistant."}]},
    "contents": [{"role": "user", "parts": [{"text": "Say hello"}]}],
}
resp = httpx.post(url, json=payload, timeout=30.0)
print("Status:", resp.status_code)
print("Response snippet:", resp.text[:300])
