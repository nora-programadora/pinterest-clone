import axios from 'axios'
import { getToken } from './token'

export const apiClient = axios.create({
  // En Netlify la API vive en el mismo dominio (/api); VITE_API_URL permite apuntar a otro backend
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
