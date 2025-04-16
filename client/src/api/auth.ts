import { post } from './client'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData extends LoginCredentials {
  name: string
}

interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
    createdAt: string
    subscription: 'free' | 'premium'
  }
  token: string
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return post<AuthResponse>('/auth/login', credentials)
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    return post<AuthResponse>('/auth/register', data)
  },

  logout: async (): Promise<void> => {
    return post('/auth/logout')
  },

  refreshToken: async (): Promise<{ token: string }> => {
    return post<{ token: string }>('/auth/refresh')
  },
} 