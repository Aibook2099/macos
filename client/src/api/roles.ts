import { get, post, put, patch, del } from './client'

export interface Role {
  id: string
  name: string
  description: string
  personality: string
  background: string
  traits: string[]
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface CreateRoleData {
  name: string
  description: string
  personality: string
  background: string
  traits: string[]
}

export interface UpdateRoleData extends Partial<CreateRoleData> {
  isActive?: boolean
}

export const rolesApi = {
  getAll: async (): Promise<{ roles: Role[] }> => {
    return get<{ roles: Role[] }>('/roles')
  },

  getById: async (id: string): Promise<{ role: Role }> => {
    return get<{ role: Role }>(`/roles/${id}`)
  },

  create: async (data: CreateRoleData): Promise<{ role: Role }> => {
    return post<{ role: Role }>('/roles', data)
  },

  update: async (id: string, data: UpdateRoleData): Promise<{ role: Role }> => {
    return patch<{ role: Role }>(`/roles/${id}`, data)
  },

  delete: async (id: string): Promise<void> => {
    return del(`/roles/${id}`)
  },
} 