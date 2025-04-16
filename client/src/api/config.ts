export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export const DEFAULT_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

export function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('token')
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export function getHeaders(): HeadersInit {
  return { ...DEFAULT_HEADERS, ...getAuthHeader() }
} 