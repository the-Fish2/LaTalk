from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import asyncio
import json
import os
from anthropic import Anthropic

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Anthropic configuration

MODEL = "claude-sonnet-4-20250514"
SYSTEM_LATEX = (
    "You transform each input by inserting LaTeX only for mathematical fragments. "
    "Keep ordinary English words; only typeset math (variables, sets, maps, equalities, quantifiers, etc.). "
    "Some examples: \"f of x\" -> $f(x)$, \"g in G\" $g\\in G$, \"from G to H\" -> $G \\to H$. "
    "Use inline math with $...$ only. Do not use display math, environments, or preambles. "
    "Use built-in commands for special characters such as \\cdot, \\alpha, \\in, etc. and for functions such as \\sin, \\log, etc. "
    "Simplify natural language to mathematical notation as much as possible. "
    "Capitalize according to mathematical conventions, such as writing sets uppercase and elements lowercase. "
    "Return ONLY the final sentence as plain text."
)

def text_of(message) -> str:
    """Concatenate all text blocks in a Message"""
    return "".join(
        b.text for b in message.content
        if getattr(b, "type", None) == "text"
    ).strip()

def get_client() -> Anthropic:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set in your environment")
    return Anthropic(api_key=api_key, timeout=30)

def latexify_text(
    client: Anthropic,
    input_text: str,
    *,
    temperature: float = 0.0,
    max_tokens: int = 500
) -> str:
    """Single call to API for natural language to LaTeX processing"""
    resp = client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        temperature=temperature,
        system=SYSTEM_LATEX,
        messages=[{"role": "user", "content": input_text}],
    )
    
    try:
        out = text_of(resp)
    except Exception:
        out = "".join(b.text for b in resp.content if getattr(b, "type", None) == "text")
    return out

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