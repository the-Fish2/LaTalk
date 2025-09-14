from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.future import select
from passlib.context import CryptContext

import asyncio
import json
# from latalk_web.src.backend.anthro_file import latex_return, command_return, get_client
from anthro_file import latex_return, command_return, get_client

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

DATABASE_URL = "sqlite+aiosqlite:///./users.db"

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    snippets = relationship("LatexSnippet", back_populates="user", cascade="all, delete")

class LatexSnippet(Base):
    __tablename__ = "latex_snippets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    latex = Column(String, nullable=False)

    user = relationship("User", back_populates="snippets")

async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

@app.post("/signup")
async def signup(data: dict, session: AsyncSession = Depends(get_session)):
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        raise HTTPException(status_code=400, detail="Missing username or password")

    result = await session.execute(select(User).where(User.username == username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pw = get_password_hash(password)
    new_user = User(username=username, hashed_password=hashed_pw)
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    return {"message": "User created successfully", "username": new_user.username}

@app.post("/login")
async def login(data: dict, session: AsyncSession = Depends(get_session)):
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        raise HTTPException(status_code=400, detail="Missing username or password")

    result = await session.execute(select(User).where(User.username == username))
    user = result.scalars().first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"access_token": user.username, "token_type": "bearer"}

@app.post("/save-latex")
async def save_latex(data: dict, session: AsyncSession = Depends(get_session)):
    username = data.get("username")
    latex = data.get("latex")
    if not username or not latex:
        raise HTTPException(status_code=400, detail="Missing username or latex")

    result = await session.execute(select(User).where(User.username == username))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    snippet = LatexSnippet(user_id=user.id, latex=latex)
    session.add(snippet)
    await session.commit()
    await session.refresh(snippet)

    return {"id": snippet.id, "latex": snippet.latex}

@app.get("/get-latex/{username}")
async def get_latex(username: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.username == username))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await session.execute(
        select(LatexSnippet).where(LatexSnippet.user_id == user.id)
    )
    snippets = result.scalars().all()
    return {"snippets": [{"id": s.id, "latex": s.latex} for s in snippets]}

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