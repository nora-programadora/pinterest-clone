import { configureStore } from '@reduxjs/toolkit'
import pinsReducer from '../features/pins/pinsSlice'
import authReducer from '../features/auth/authSlice'

export const store = configureStore({
  reducer: {
    pins: pinsReducer,
    auth: authReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch