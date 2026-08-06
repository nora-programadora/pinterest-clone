from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PinCreate(BaseModel):
    unsplash_id: str
    image_url: str
    title: str | None = None
    author: str | None = None


class PinOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    board_id: int
    unsplash_id: str
    image_url: str
    title: str | None
    author: str | None
    created_at: datetime
