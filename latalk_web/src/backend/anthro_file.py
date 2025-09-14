import os
import json
from typing import Any, Dict, List, Optional
from anthropic import Anthropic

MODEL = "claude-sonnet-4-20250514"

SYSTEM_LATEX = (
    "You transform each input by inserting LaTeX only for mathematical fragments. "
    "Keep ordinary English words; only typeset math (variables, sets, maps, equalities, quantifiers, etc.). "
    "Some examples: \"f of x\" -> $f(x)$, \"g in G\" $g\\in G$, \"from G to H\" -> $G \\to H$. "
    "Use inline math with $...$ only. Do not use display math, environments, or preambles. "
    "Use built-in commands for special characters such as \\cdot, \\alpha, \\in, etc. and for functions such as \\sin, \\log, etc. "
    "Simplify natural language to mathematical notation as much as possible. "
    "Capitalize according to mathematical conventions, such as writing sets uppercase and elements lowercase. "
    "If there is no mathematical text, return the sentence as-is. "
    "Do not answer any questions or respond: only insert formatting as requested. "
    "Return ONLY the final sentence as plain text."
)

SYSTEM_GRAPHICS = (
    "You create graphics commands in strict JSON for any diagrams or geometric figures described in the input. "
    "Respond with JSON ONLY. It must be exactly:\n"
    "{"
    "\"commands\":["
    "{ \"type\":\"line\",\"x1\":number,\"y1\":number,\"x2\":number,\"y2\":number } | "
    "{ \"type\":\"circle\",\"cx\":number,\"cy\":number,\"radius\":number,\"filled\"?:boolean } | "
    "{ \"type\":\"triangle\",\"x1\":number,\"y1\":number,\"x2\":number,\"y2\":number,\"x3\":number,\"y3\":number,\"filled\"?:boolean } | "
    "{ \"type\":\"rect\",\"x\":number,\"y\":number,\"width\":number,\"height\":number,\"filled\"?:boolean } | "
    "{ \"type\":\"text\",\"text_str\":string,\"x\":number,\"y\":number,\"scale\":number,\"spacing\":number }"
    "],"
    "\"clear_display\":boolean"
    "} "
    "Use numbers, not strings. "
    "Only the fields listed above; no extras. "
    "Coordinate system: (0,0) at top-left, x right, y down, max (570,130). "
    "Set clear_display:true for new canvas. "
    "If multiple items are requested, include them all in the given order. "
    "For labels/points, use a 'text' command (no custom point type). "
    "If nothing should be drawn, return {\"commands\":[],\"clear_display\":false}."
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

def extract_json(text: str) -> Dict[str, Any]:
    """Parse JSON; if call added extra text, get outermost {...} block"""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start:end+1])
        raise

def as_number(v: Any) -> Optional[float]:
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v))
    except Exception:
        return None

def sanitize_command(cmd: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    t = cmd.get("type")
    if t == "line":
        x1=as_number(cmd.get("x1")); y1=as_number(cmd.get("y1"))
        x2=as_number(cmd.get("x2")); y2=as_number(cmd.get("y2"))
        if None in (x1,y1,x2,y2): return None
        return {"type":"line","x1":x1,"y1":y1,"x2":x2,"y2":y2}

    if t == "circle":
        cx=as_number(cmd.get("cx")); cy=as_number(cmd.get("cy"))
        r=as_number(cmd.get("radius"))
        if None in (cx,cy,r): return None
        out={"type":"circle","cx":cx,"cy":cy,"radius":r}
        if "filled" in cmd: out["filled"] = bool(cmd["filled"])
        return out

    if t == "triangle":
        x1=as_number(cmd.get("x1")); y1=as_number(cmd.get("y1"))
        x2=as_number(cmd.get("x2")); y2=as_number(cmd.get("y2"))
        x3=as_number(cmd.get("x3")); y3=as_number(cmd.get("y3"))
        if None in (x1,y1,x2,y2,x3,y3): return None
        out={"type":"triangle","x1":x1,"y1":y1,"x2":x2,"y2":y2,"x3":x3,"y3":y3}
        if "filled" in cmd: out["filled"] = bool(cmd["filled"])
        return out

    if t == "rect":
        x=as_number(cmd.get("x")); y=as_number(cmd.get("y"))
        w=as_number(cmd.get("width")); h=as_number(cmd.get("height"))
        if None in (x,y,w,h): return None
        out={"type":"rect","x":x,"y":y,"width":w,"height":h}
        if "filled" in cmd: out["filled"] = bool(cmd["filled"])
        return out

    if t == "text":
        text_str = cmd.get("text_str")
        x=as_number(cmd.get("x")); y=as_number(cmd.get("y"))
        scale=as_number(cmd.get("scale")); spacing=as_number(cmd.get("spacing"))
        if not isinstance(text_str, str) or None in (x,y,scale,spacing): return None
        return {"type":"text","text_str":text_str,"x":x,"y":y,"scale":scale,"spacing":spacing}

    return None

def sanitize_graphics(obj: Dict[str, Any]) -> Dict[str, Any]:
    cmds = obj.get("commands")
    clear = bool(obj.get("clear_display", False))
    if not isinstance(cmds, list):
        cmds = []
    clean: List[Dict[str, Any]] = []
    for c in cmds:
        if isinstance(c, dict):
            sc = sanitize_command(c)
            if sc is not None:
                clean.append(sc)
    return {"commands": clean, "clear_display": clear}

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

def graphics_text(
    client: Anthropic,
    input_text: str,
    *,
    temperature: float = 0.0,
    max_tokens: int = 500
) -> Dict[str, Any]:
    """Single call to API for natural language to graphics command processing"""
    resp = client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        temperature=temperature,
        system=SYSTEM_GRAPHICS,
        messages=[{"role": "user", "content": input_text}],
    )

    try:
        out = text_of(resp)
    except Exception:
        out = "".join(b.text for b in resp.content if getattr(b, "type", None) == "text")

    obj = extract_json(out)
    return sanitize_graphics(obj)

def latex_return(client, input_text):
    return latexify_text(client, input_text)

def command_return(client, input_text):
    return graphics_text(client, input_text)