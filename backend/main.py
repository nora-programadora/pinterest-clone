import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models  # noqa: F401 — registers all models on Base before create_all
from database import Base, engine
from routers import auth, boards, pins

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pinterest Clone API")

# Comma-separated list of allowed frontend origins, e.g. "https://my-app.netlify.app"
extra_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", *extra_origins],
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
