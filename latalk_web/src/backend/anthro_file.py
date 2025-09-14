import os
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

def latex_return(input_text):
    #this function should return two things!
    #1. a string containing the latex
    #2. geometry displays following the format I specified
    #for now it's not implemented
    return (
        "testing the quadratic formula which is $\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$. it is useful. $$\\int_0^\\infty x^2 dx$$ $$\\int_0^\\infty x^2 dx$$ very cool stuff. remember teh quadratic formula: $\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$??",
        )

def command_return(input_text):
    return {"commands": [], "clear_display": True}