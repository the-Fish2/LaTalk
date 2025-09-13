from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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

    user_input = data.get("input", "")

    # Example: respond "Received" if input contains "hello"
    if "hello" in user_input.lower():
        response_text = {"nl": "Received", "latex": ""}
    else:
        response_text = {"nl": "Processed: " + user_input, "latex": ""}

    return JSONResponse(content=response_text)