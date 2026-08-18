import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { apiClient } from '../../shared/api/client'
import { getToken, setToken, clearToken } from '../../shared/api/token'

const STORED_EMAIL_KEY = 'pinterest-clone:email'

interface AuthUser {
  email: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: AuthState = {
  user: (() => {
    const email = localStorage.getItem(STORED_EMAIL_KEY)
    return email ? { email } : null
  })(),
  token: getToken(),
  status: 'idle',
  error: null,
}

interface AuthCredentials {
  email: string
  password: string
}

interface AuthResponse {
  access_token: string
  token_type: string
}

interface AuthResult {
  token: string
  email: string
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string') {
    return error.response.data.detail
  }
  return 'Ocurrió un error inesperado'
}

export const login = createAsyncThunk<AuthResult, AuthCredentials, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials)
      return { token: data.access_token, email: credentials.email }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const register = createAsyncThunk<AuthResult, AuthCredentials, { rejectValue: string }>(
  'auth/register',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/register', credentials)
      return { token: data.access_token, email: credentials.email }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      state.status = 'idle'
      state.error = null
      clearToken()
      localStorage.removeItem(STORED_EMAIL_KEY)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.token = action.payload.token
        state.user = { email: action.payload.email }
        setToken(action.payload.token)
        localStorage.setItem(STORED_EMAIL_KEY, action.payload.email)
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Ocurrió un error inesperado'
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.token = action.payload.token
        state.user = { email: action.payload.email }
        setToken(action.payload.token)
        localStorage.setItem(STORED_EMAIL_KEY, action.payload.email)
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Ocurrió un error inesperado'
      })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
