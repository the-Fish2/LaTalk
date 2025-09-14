from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

import asyncio
import json
from latalk_web.src.backend.anthro_file import latex_return, command_return, get_client

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

@app.on_event("startup")
async def startup_event():
    # Code that runs once when the app starts
    global claude_agent
    claude_agent = get_client()

@app.on_event("shutdown")
async def shutdown_event():
    # Cleanup logic
    await claude_agent.close()

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

async def manage_latex_text(claude_agent, input_text: str):
    async def task():
        try:
            latex = latex_return(claude_agent, input_text)
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

    await manage_latex_text(claude_agent, user_input)

    response_text = await command_return(user_input)

    return JSONResponse(content=response_text, media_type="application/json")