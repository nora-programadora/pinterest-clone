import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../../shared/hooks/redux'
import { login, register } from './authSlice'

function LoginForm() {
  const dispatch = useAppDispatch()
  const status = useAppSelector((state) => state.auth.status)
  const error = useAppSelector((state) => state.auth.error)

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isLoading = status === 'loading'

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const credentials = { email, password }
    if (mode === 'login') {
      dispatch(login(credentials))
    } else {
      dispatch(register(credentials))
    }
  }

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleSubmit}>
        <h1 style={styles.title}>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>

        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        {error !== null && <p style={styles.errorText}>{error}</p>}

        <button style={styles.submitBtn} type="submit" disabled={isLoading}>
          {isLoading ? 'Cargando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>

        <button
          style={styles.switchBtn}
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
        </button>
      </form>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f0f0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '320px',
    padding: '32px',
    backgroundColor: '#fff',
    borderRadius: '16px',
  },
  title: {
    textAlign: 'center',
    fontSize: '20px',
    margin: '0 0 8px',
    color: '#111',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: '14px',
    margin: 0,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: '#E60023',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    padding: '12px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: '#767676',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '4px',
  },
}

export default LoginForm
