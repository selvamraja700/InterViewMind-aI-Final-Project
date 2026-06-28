import os
import httpx
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GROQ_API_KEY")
print("Key loaded:", bool(key))

if not key:
    raise SystemExit("GROQ_API_KEY not set in .env")

url = "https://api.groq.com/openai/v1/chat/completions"
payload = {
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Briefly explain fast AI inference."}],
}
resp = httpx.post(
    url,
    headers={
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    },
    json=payload,
    timeout=30.0,
)
print("Status:", resp.status_code)
print("Response snippet:", resp.text[:300])
