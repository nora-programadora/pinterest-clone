import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Pin } from '../../types'

// Slice state
interface PinsState {
  items: Pin[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  page: number
  hasMore: boolean
}

const initialState: PinsState = {
  items: [],
  status: 'idle',
  error: null,
  page: 1,
  hasMore: true,
}

// Thunk — llama a Unsplash y trae los pins
export const fetchPins = createAsyncThunk(
  'pins/fetchPins',
  async (page: number) => {
    const response = await fetch(
      `https://api.unsplash.com/photos?page=${page}&per_page=20`,
      {
        headers: {
          Authorization: `Client-ID ${import.meta.env.VITE_UNSPLASH_ACCESS_KEY}`,
        },
      }
    )

    if (!response.ok) throw new Error('Error al cargar los pins')

    const data = await response.json()

    // Mapeamos la respuesta de Unsplash a nuestro tipo Pin
    return data.map((photo: any) => ({
      id: photo.id,
      imageUrl: photo.urls.regular,
      title: photo.alt_description ?? 'Sin título',
      description: photo.description ?? undefined,
      author: photo.user.name,
      width: photo.width,
      height: photo.height,
    })) as Pin[]
  }
)

const pinsSlice = createSlice({
  name: 'pins',
  initialState,
  reducers: {
    // Resetea el feed — útil cuando el usuario regresa al home
    resetPins(state) {
      state.items = []
      state.page = 1
      state.hasMore = true
      state.status = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPins.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchPins.fulfilled, (state, action: PayloadAction<Pin[]>) => {
        state.status = 'succeeded'
        
        // Filtra duplicados antes de agregar al estado
        const existingIds = new Set(state.items.map((pin) => pin.id))
        const newPins = action.payload.filter((pin) => !existingIds.has(pin.id))
        
        state.items.push(...newPins)
        state.page += 1
        state.hasMore = action.payload.length > 0
      })
      .addCase(fetchPins.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message ?? 'Error desconocido'
      })
  },
})

export const { resetPins } = pinsSlice.actions
export default pinsSlice.reducer