from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

import asyncio
import json


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulate processing input text word by word
async def process_text(input_text: str):
    words = input_text.split()
    for word in words:
        await asyncio.sleep(0.5)  # simulate delay
        yield json.dumps({
            "nl": word.upper(),
            "latex": f"\\\\textbf{{{word}}}"
        }) + "\n"

@app.post("/stream")
async def stream_text(request: Request):
    data = await request.json()
    input_text = data.get("input", "Lorem ipsum")
    return StreamingResponse(process_text(input_text), media_type="application/json")
