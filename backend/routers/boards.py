from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_owned_board
from models.board import Board
from models.user import User
from schemas.board import BoardCreate, BoardOut, BoardUpdate
from security import get_current_user

router = APIRouter(prefix="/boards", tags=["boards"])


@router.get("", response_model=list[BoardOut])
def list_boards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Board]:
    return db.query(Board).filter(Board.owner_id == current_user.id).all()


@router.post("", response_model=BoardOut, status_code=status.HTTP_201_CREATED)
def create_board(
    payload: BoardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Board:
    board = Board(name=payload.name, description=payload.description, owner_id=current_user.id)
    db.add(board)
    db.commit()
    db.refresh(board)
    return board


@router.put("/{board_id}", response_model=BoardOut)
def update_board(
    payload: BoardUpdate,
    board: Board = Depends(get_owned_board),
    db: Session = Depends(get_db),
) -> Board:
    if payload.name is not None:
        board.name = payload.name
    if payload.description is not None:
        board.description = payload.description

    db.commit()
    db.refresh(board)
    return board


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(
    board: Board = Depends(get_owned_board),
    db: Session = Depends(get_db),
) -> None:
    db.delete(board)
    db.commit()
