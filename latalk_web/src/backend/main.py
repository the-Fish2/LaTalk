from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

import asyncio
import json
from latalk_web.src.backend.anthro_file import andreas_magic_function

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

natural_text_message_queue: asyncio.Queue[str] = asyncio.Queue()
latex_text_message_queue: asyncio.Queue[str] = asyncio.Queue()

@app.get("/events")
async def events():
    async def event_generator():
        while True:
            await asyncio.sleep(1)
            message = await natural_text_message_queue.get()

            yield {
                "event": "message",
                "data": json.dumps({"text": message})
            }

    return EventSourceResponse(event_generator())

@app.get("/latex_events")
async def latex_events():
    async def event_generator():
        while True:
            await asyncio.sleep(1)
            message = await latex_text_message_queue.get()

            yield {
                "event": "message",
                "data": json.dumps({"text": message})
            }

    return EventSourceResponse(event_generator())

# Simulate processing input text word by word
async def process_text(input_text: str):
    words = input_text.split()
    for word in words:
        await asyncio.sleep(0.5)  # simulate delay
        yield json.dumps({
            "nl": word.upper(),
            "latex": f"\\\\textbf{{{word}}}"
        }) + "\n"

async def manage_latex_text(input_text: str):
    async def task():
        try:
            latex, _geometry = andreas_magic_function()
            print(latex)
            # push LaTeX result when ready
            await latex_text_message_queue.put(latex)
        except Exception as e:
            print(f"Error in manage_latex_text: {e}")

    # fire-and-forget background job
    asyncio.create_task(task())

@app.post("/stream")
async def stream_text(request: Request):
    data = await request.json()

    user_input = data.get("input", "")

    await natural_text_message_queue.put(user_input)

    #await latex_text_message_queue.put(user_input)
    await manage_latex_text(user_input)

    if "a" in user_input:
        response_text = {"commands": [{ "type": "circle", "cx": 50, "cy": 50, "radius": 20}, { "type": "line", "x1": 50, "y1": 50, "x2": 70, "y2": 50 }, { "type": "text", "text_str": "A", "x": 38, "y": 34, "scale": 2, "spacing": 1 }], "clear_display": True}
    else:
        response_text = {"commands": [], "clear_display": False}

    return JSONResponse(content=response_text, media_type="application/json")