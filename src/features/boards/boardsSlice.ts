import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { apiClient } from '../../shared/api/client'
import type { Board, BoardPin, Pin } from '../../types'

interface BoardsState {
  items: Board[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: BoardsState = {
  items: [],
  status: 'idle',
  error: null,
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string') {
    return error.response.data.detail
  }
  return 'Ocurrió un error inesperado'
}

export const fetchBoards = createAsyncThunk<Board[], void, { rejectValue: string }>(
  'boards/fetchBoards',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<Board[]>('/boards')
      return data
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const createBoard = createAsyncThunk<Board, { name: string; description?: string }, { rejectValue: string }>(
  'boards/createBoard',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<Board>('/boards', payload)
      return data
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const savePinToBoard = createAsyncThunk<
  { boardId: number; pin: BoardPin },
  { boardId: number; pin: Pin },
  { rejectValue: string }
>('boards/savePinToBoard', async ({ boardId, pin }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<BoardPin>(`/boards/${boardId}/pins`, {
      unsplash_id: pin.id,
      image_url: pin.imageUrl,
      title: pin.title,
      author: pin.author,
    })
    return { boardId, pin: data }
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export const updateBoard = createAsyncThunk<
  Board,
  { boardId: number; name?: string; description?: string },
  { rejectValue: string }
>('boards/updateBoard', async ({ boardId, ...changes }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.put<Board>(`/boards/${boardId}`, changes)
    return data
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export const deleteBoard = createAsyncThunk<number, number, { rejectValue: string }>(
  'boards/deleteBoard',
  async (boardId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/boards/${boardId}`)
      return boardId
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const removePinFromBoard = createAsyncThunk<
  { boardId: number; pinId: number },
  { boardId: number; pinId: number },
  { rejectValue: string }
>('boards/removePinFromBoard', async ({ boardId, pinId }, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/boards/${boardId}/pins/${pinId}`)
    return { boardId, pinId }
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

const boardsSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoards.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Ocurrió un error inesperado'
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })
      .addCase(savePinToBoard.fulfilled, (state, action) => {
        const board = state.items.find((b) => b.id === action.payload.boardId)
        if (board) {
          board.pins.push(action.payload.pin)
        }
      })
      .addCase(updateBoard.fulfilled, (state, action) => {
        const index = state.items.findIndex((b) => b.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.items = state.items.filter((board) => board.id !== action.payload)
      })
      .addCase(removePinFromBoard.fulfilled, (state, action) => {
        const board = state.items.find((b) => b.id === action.payload.boardId)
        if (board) {
          board.pins = board.pins.filter((p) => p.id !== action.payload.pinId)
        }
      })
  },
})

export default boardsSlice.reducer
