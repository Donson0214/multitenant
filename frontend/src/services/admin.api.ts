import api from './http'
import type { AdminListResponse, AdminTenant, AdminUser } from '../types/admin'

export async function listAdminTenants(params: {
  page?: number
  pageSize?: number
} = {}): Promise<AdminListResponse<AdminTenant>> {
  const { data } = await api.get('/api/v1/admin/tenants', { params })
  return data as AdminListResponse<AdminTenant>
}

export async function listAdminUsers(params: {
  page?: number
  pageSize?: number
} = {}): Promise<AdminListResponse<AdminUser>> {
  const { data } = await api.get('/api/v1/admin/users', { params })
  return data as AdminListResponse<AdminUser>
}
