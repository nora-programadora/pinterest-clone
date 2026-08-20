import { configureStore } from '@reduxjs/toolkit'
import pinsReducer from '../features/pins/pinsSlice'
import authReducer from '../features/auth/authSlice'
import boardsReducer from '../features/boards/boardsSlice'

export const store = configureStore({
  reducer: {
    pins: pinsReducer,
    auth: authReducer,
    boards: boardsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch