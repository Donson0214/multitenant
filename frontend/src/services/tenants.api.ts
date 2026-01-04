import api from './http'
import type { TenantBootstrap } from '../types/tenant'

export async function getMe(): Promise<TenantBootstrap> {
  const { data } = await api.get('/api/v1/tenants/me')
  return data as TenantBootstrap
}

export async function createTenant(payload: { name: string }) {
  const { data } = await api.post('/api/v1/tenants', payload)
  return data as { id: string; name: string }
}
