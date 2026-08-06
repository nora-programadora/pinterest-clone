from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models  # noqa: F401 — registers all models on Base before create_all
from database import Base, engine
from routers import auth, boards, pins

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pinterest Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(boards.router)
app.include_router(pins.router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
