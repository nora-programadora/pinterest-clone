import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../shared/hooks/redux'
import { fetchBoards, createBoard } from './boardsSlice'

function BoardsPage() {
  const dispatch = useAppDispatch()
  const boards = useAppSelector((state) => state.boards.items)
  const status = useAppSelector((state) => state.boards.status)
  const error = useAppSelector((state) => state.boards.error)

  const [isCreating, setIsCreating] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchBoards())
    }
  }, [dispatch, status])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    const name = newBoardName.trim()
    if (!name) return

    const result = await dispatch(createBoard({ name }))
    if (createBoard.fulfilled.match(result)) {
      setNewBoardName('')
      setIsCreating(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Tus tableros</h1>
        <button style={styles.newBoardBtn} onClick={() => setIsCreating((v) => !v)}>
          {isCreating ? 'Cancelar' : '+ Crear tablero'}
        </button>
      </div>

      {isCreating && (
        <form style={styles.newBoardForm} onSubmit={handleCreate}>
          <input
            style={styles.newBoardInput}
            type="text"
            placeholder="Nombre del tablero"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            autoFocus
          />
          <button style={styles.createBtn} type="submit">
            Crear
          </button>
        </form>
      )}

      {status === 'loading' && boards.length === 0 && <p style={styles.hint}>Cargando tableros...</p>}
      {status === 'failed' && error !== null && <p style={styles.errorText}>{error}</p>}
      {status === 'succeeded' && boards.length === 0 && (
        <p style={styles.hint}>Todavía no tenés tableros. Guardá un pin o creá uno arriba.</p>
      )}

      <div style={styles.grid}>
        {boards.map((board) => {
          const preview = board.pins.slice(0, 4)
          return (
            <Link key={board.id} to={`/boards/${board.id}`} style={styles.card}>
              <div style={styles.previewGrid}>
                {preview.length === 0 ? (
                  <div style={styles.previewEmpty} />
                ) : (
                  preview.map((pin) => (
                    <img key={pin.id} src={pin.image_url} alt="" style={styles.previewImg} />
                  ))
                )}
              </div>
              <p style={styles.boardName}>{board.name}</p>
              <p style={styles.pinCount}>{board.pins.length} pin{board.pins.length !== 1 ? 's' : ''}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px 24px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '22px',
    color: '#111',
    margin: 0,
  },
  newBoardBtn: {
    backgroundColor: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    padding: '10px 18px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  newBoardForm: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    maxWidth: '360px',
  },
  newBoardInput: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  createBtn: {
    backgroundColor: '#E60023',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '14px',
    color: '#767676',
  },
  errorText: {
    fontSize: '14px',
    color: '#d32f2f',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px',
  },
  card: {
    display: 'block',
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: '2px',
    aspectRatio: '1 / 1',
    borderRadius: '16px',
    overflow: 'hidden',
    backgroundColor: '#efefef',
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  previewEmpty: {
    gridColumn: '1 / 3',
    gridRow: '1 / 3',
    backgroundColor: '#efefef',
  },
  boardName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#111',
    margin: '10px 0 2px',
  },
  pinCount: {
    fontSize: '13px',
    color: '#767676',
    margin: 0,
  },
}

export default BoardsPage
