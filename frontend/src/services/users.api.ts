import api from './http'
import type { AppUser } from '../types/user'

export async function listUsers(): Promise<AppUser[]> {
  const { data } = await api.get('/api/v1/users')
  return data as AppUser[]
}

export async function inviteUser(payload: { email: string; role: string }) {
  const { data } = await api.post('/api/v1/users', payload)
  return data as unknown
}

export async function updateUserRole(userId: string, role: string) {
  const { data } = await api.patch(`/api/v1/users/${userId}/role`, { role })
  return data as unknown
}

export async function removeUser(userId: string): Promise<{ success: boolean }> {
  const { data } = await api.delete(`/api/v1/users/${userId}`)
  return data as { success: boolean }
}
