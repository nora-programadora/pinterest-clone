from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.board import Board
from models.user import User
from security import get_current_user


def get_owned_board(
    board_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Board:
    board = db.query(Board).filter(Board.id == board_id).first()
    if board is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your board")
    return board
