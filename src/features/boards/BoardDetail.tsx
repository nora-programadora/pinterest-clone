import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../shared/hooks/redux'
import { fetchBoards, deleteBoard, removePinFromBoard } from './boardsSlice'

function BoardDetail() {
  const { boardId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const status = useAppSelector((state) => state.boards.status)
  const board = useAppSelector((state) =>
    state.boards.items.find((b) => b.id === Number(boardId))
  )

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchBoards())
    }
  }, [dispatch, status])

  const handleDeleteBoard = async () => {
    if (!board) return
    if (!window.confirm(`¿Eliminar el tablero "${board.name}"? Esta acción no se puede deshacer.`)) return

    setIsDeleting(true)
    const result = await dispatch(deleteBoard(board.id))
    setIsDeleting(false)
    if (deleteBoard.fulfilled.match(result)) {
      navigate('/boards')
    } else {
      setDeleteError(result.payload ?? 'No se pudo eliminar el tablero')
    }
  }

  const handleRemovePin = (pinId: number) => {
    if (!board) return
    dispatch(removePinFromBoard({ boardId: board.id, pinId }))
  }

  if (status === 'loading' && !board) {
    return <p style={styles.hint}>Cargando tablero...</p>
  }

  if (!board && (status === 'succeeded' || status === 'failed')) {
    return (
      <div style={styles.container}>
        <p style={styles.hint}>No se encontró el tablero.</p>
        <Link to="/boards" style={styles.backLink}>
          ← Volver a tableros
        </Link>
      </div>
    )
  }

  if (!board) return null

  return (
    <div style={styles.container}>
      <Link to="/boards" style={styles.backLink}>
        ← Tableros
      </Link>

      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>{board.name}</h1>
          <p style={styles.pinCount}>
            {board.pins.length} pin{board.pins.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button style={styles.deleteBtn} onClick={handleDeleteBoard} disabled={isDeleting}>
          {isDeleting ? 'Eliminando...' : 'Eliminar tablero'}
        </button>
      </div>

      {deleteError !== null && <p style={styles.errorText}>{deleteError}</p>}

      {board.pins.length === 0 ? (
        <p style={styles.hint}>Este tablero todavía no tiene pins guardados.</p>
      ) : (
        <div style={styles.grid}>
          {board.pins.map((pin) => (
            <div key={pin.id} style={styles.card}>
              <img src={pin.image_url} alt={pin.title ?? ''} style={styles.image} />
              <button style={styles.removeBtn} onClick={() => handleRemovePin(pin.id)}>
                Quitar
              </button>
              {pin.title && <p style={styles.pinTitle}>{pin.title}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px 24px',
  },
  backLink: {
    display: 'inline-block',
    fontSize: '14px',
    color: '#767676',
    textDecoration: 'none',
    marginBottom: '16px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    color: '#111',
    margin: '0 0 4px',
  },
  pinCount: {
    fontSize: '14px',
    color: '#767676',
    margin: 0,
  },
  deleteBtn: {
    background: 'none',
    border: '1px solid #d32f2f',
    color: '#d32f2f',
    borderRadius: '24px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  errorText: {
    fontSize: '14px',
    color: '#d32f2f',
  },
  hint: {
    fontSize: '14px',
    color: '#767676',
    padding: '16px 24px',
  },
  grid: {
    columnCount: 4,
    columnGap: '16px',
  },
  card: {
    position: 'relative',
    breakInside: 'avoid',
    marginBottom: '16px',
    borderRadius: '16px',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    display: 'block',
    borderRadius: '16px',
  },
  removeBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: 'rgba(17,17,17,0.85)',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  pinTitle: {
    fontSize: '13px',
    color: '#111',
    margin: '8px 4px 12px',
  },
}

export default BoardDetail
