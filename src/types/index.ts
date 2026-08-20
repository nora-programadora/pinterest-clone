export interface Pin {
  id: string
  imageUrl: string
  title: string
  description?: string
  author: string
  width: number
  height: number
}

// Un pin ya guardado dentro de un board — mismo shape que PinOut del backend
export interface BoardPin {
  id: number
  board_id: number
  unsplash_id: string
  image_url: string
  title: string | null
  author: string | null
  created_at: string
}

// Mismo shape que BoardOut del backend
export interface Board {
  id: number
  name: string
  description: string | null
  owner_id: number
  created_at: string
  pins: BoardPin[]
}

export interface User {
  id: string
  username: string
  email: string
  avatarUrl?: string
}