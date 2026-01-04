import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
const AUTH_STORAGE_KEY = 'analytics-auth-token'

export const getAuthToken = () => {
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_API_TOKEN
  }
  return localStorage.getItem(AUTH_STORAGE_KEY) ?? import.meta.env.VITE_API_TOKEN
}

export const setAuthToken = (token: string | null) => {
  if (typeof window === 'undefined') return
  if (!token) {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }
  localStorage.setItem(AUTH_STORAGE_KEY, token)
}

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }
  return config
})

export default api
