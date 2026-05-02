import { configureStore } from '@reduxjs/toolkit'
import pinsReducer from '../features/pins/pinsSlice'

export const store = configureStore({
  reducer: {
    pins: pinsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch