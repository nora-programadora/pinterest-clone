import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Pin } from '../../types'
import { useAppDispatch, useAppSelector } from '../../shared/hooks/redux'
import { fetchBoards, createBoard, savePinToBoard } from '../boards/boardsSlice'

interface PinCardProps {
  pin: Pin
}

function PinCard({ pin }: PinCardProps) {
  const dispatch = useAppDispatch()
  const boards = useAppSelector((state) => state.boards.items)
  const boardsStatus = useAppSelector((state) => state.boards.status)
  const isSaved = useAppSelector((state) =>
    state.boards.items.some((board) => board.pins.some((p) => p.unsplash_id === pin.id))
  )

  const [isHovered, setIsHovered] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMenuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  const handleToggleMenu = () => {
    setSaveError(null)
    setIsMenuOpen((open) => !open)
    if (boardsStatus === 'idle') {
      dispatch(fetchBoards())
    }
  }

  const handleSaveToBoard = async (boardId: number) => {
    const result = await dispatch(savePinToBoard({ boardId, pin }))
    if (savePinToBoard.fulfilled.match(result)) {
      setIsMenuOpen(false)
    } else {
      setSaveError(result.payload ?? 'No se pudo guardar el pin')
    }
  }

  const handleCreateAndSave = async (e: FormEvent) => {
    e.preventDefault()
    const name = newBoardName.trim()
    if (!name) return

    const created = await dispatch(createBoard({ name }))
    if (createBoard.fulfilled.match(created)) {
      setNewBoardName('')
      await handleSaveToBoard(created.payload.id)
    } else {
      setSaveError(created.payload ?? 'No se pudo crear el tablero')
    }
  }

  return (
    <div style={styles.card}>
      <div
        style={styles.imageWrapper}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={pin.imageUrl}
          alt={pin.title}
          loading="lazy"
          style={styles.image}
        />
        <div
          style={{
            ...styles.overlay,
            opacity: isHovered || isMenuOpen ? 1 : 0,
          }}
        >
          <div ref={menuRef} style={styles.menuWrapper}>
            <button
              style={{
                ...styles.saveButton,
                ...(isSaved ? styles.saveButtonSaved : {}),
              }}
              onClick={handleToggleMenu}
            >
              {isSaved ? 'Guardado' : 'Guardar'}
            </button>

            {isMenuOpen && (
              <div style={styles.menu}>
                <p style={styles.menuTitle}>Guardar en un tablero</p>

                {boardsStatus === 'loading' && <p style={styles.menuHint}>Cargando tableros...</p>}
                {boardsStatus === 'succeeded' && boards.length === 0 && (
                  <p style={styles.menuHint}>Todavía no tenés tableros</p>
                )}

                <div style={styles.boardList}>
                  {boards.map((board) => (
                    <button
                      key={board.id}
                      style={styles.boardOption}
                      onClick={() => handleSaveToBoard(board.id)}
                    >
                      {board.name}
                    </button>
                  ))}
                </div>

                <form style={styles.newBoardForm} onSubmit={handleCreateAndSave}>
                  <input
                    style={styles.newBoardInput}
                    type="text"
                    placeholder="Nuevo tablero"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                  />
                  <button style={styles.createBtn} type="submit">
                    Crear
                  </button>
                </form>

                {saveError !== null && <p style={styles.errorText}>{saveError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.info}>
        <p style={styles.title}>{pin.title}</p>
        <p style={styles.author}>{pin.author}</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    borderRadius: '16px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    breakInside: 'avoid',
    marginBottom: '16px',
    cursor: 'pointer',
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    display: 'block',
    borderRadius: '16px',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '16px',
    transition: 'opacity 0.2s ease',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: '12px',
  },
  menuWrapper: {
    position: 'relative',
  },
  saveButton: {
    backgroundColor: '#E60023',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    padding: '8px 16px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  saveButtonSaved: {
    backgroundColor: '#111',
  },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '220px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    padding: '12px',
    cursor: 'default',
  },
  menuTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111',
    margin: '0 0 8px',
  },
  menuHint: {
    fontSize: '13px',
    color: '#767676',
    margin: '0 0 8px',
  },
  boardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxHeight: '160px',
    overflowY: 'auto',
    marginBottom: '8px',
  },
  boardOption: {
    background: 'none',
    border: 'none',
    textAlign: 'left',
    padding: '8px',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#111',
    cursor: 'pointer',
  },
  newBoardForm: {
    display: 'flex',
    gap: '6px',
    borderTop: '1px solid #eee',
    paddingTop: '8px',
  },
  newBoardInput: {
    flex: 1,
    minWidth: 0,
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '12px',
  },
  createBtn: {
    backgroundColor: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: '12px',
    margin: '8px 0 0',
  },
  info: {
    padding: '8px 4px 12px',
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px',
    color: '#111',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  author: {
    fontSize: '12px',
    color: '#767676',
    margin: 0,
  },
}

export default PinCard
