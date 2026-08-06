from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_owned_board
from models.board import Board
from models.pin import Pin
from schemas.pin import PinCreate, PinOut

router = APIRouter(prefix="/boards/{board_id}/pins", tags=["pins"])


@router.post("", response_model=PinOut, status_code=status.HTTP_201_CREATED)
def add_pin(
    payload: PinCreate,
    board: Board = Depends(get_owned_board),
    db: Session = Depends(get_db),
) -> Pin:
    pin = Pin(board_id=board.id, **payload.model_dump())
    db.add(pin)
    db.commit()
    db.refresh(pin)
    return pin


@router.delete("/{pin_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_pin(
    pin_id: int,
    board: Board = Depends(get_owned_board),
    db: Session = Depends(get_db),
) -> None:
    pin = db.query(Pin).filter(Pin.id == pin_id, Pin.board_id == board.id).first()
    if pin is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pin not found")

    db.delete(pin)
    db.commit()
