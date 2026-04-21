export interface Pin {
  id: string
  imageUrl: string
  title: string
  description?: string
  author: string
  width: number
  height: number
}

export interface Board {
  id: string
  name: string
  description?: string
  pinIds: string[]
  coverImageUrl?: string
}

export interface User {
  id: string
  username: string
  email: string
  avatarUrl?: string
}