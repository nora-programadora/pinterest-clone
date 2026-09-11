import { Link, Route, Routes } from 'react-router-dom'
import PinFeed from './features/pins/PinFeed'
import LoginForm from './features/auth/LoginForm'
import BoardsPage from './features/boards/BoardsPage'
import BoardDetail from './features/boards/BoardDetail'
import { useAppDispatch, useAppSelector } from './shared/hooks/redux'
import { logout } from './features/auth/authSlice'

function App() {
  const dispatch = useAppDispatch()
  const token = useAppSelector((state) => state.auth.token)
  const user = useAppSelector((state) => state.auth.user)

  if (!token) {
    return <LoginForm />
  }

  return (
    <div>
      <header style={styles.header}>
        <nav style={styles.nav}>
          <Link to="/" style={styles.navLink}>
            Inicio
          </Link>
          <Link to="/boards" style={styles.navLink}>
            Tableros
          </Link>
        </nav>
        <span style={styles.email}>{user?.email}</span>
        <button style={styles.logoutBtn} onClick={() => dispatch(logout())}>
          Cerrar sesión
        </button>
      </header>
      <Routes>
        <Route path="/" element={<PinFeed />} />
        <Route path="/boards" element={<BoardsPage />} />
        <Route path="/boards/:boardId" element={<BoardDetail />} />
      </Routes>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#fff',
  },
  nav: {
    display: 'flex',
    gap: '16px',
    marginRight: 'auto',
  },
  navLink: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111',
    textDecoration: 'none',
  },
  email: {
    fontSize: '14px',
    color: '#767676',
  },
  logoutBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '24px',
    padding: '8px 16px',
    fontSize: '13px',
    cursor: 'pointer',
  },
}

export default App
