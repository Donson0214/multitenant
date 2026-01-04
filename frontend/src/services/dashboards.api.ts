import api from './http'
import type { Dashboard, DashboardPermission, DashboardLayout } from '../types/dashboard'

export async function listDashboards(): Promise<Dashboard[]> {
  const { data } = await api.get('/api/v1/dashboards')
  return data as Dashboard[]
}

export async function getDashboard(id: string): Promise<Dashboard> {
  const { data } = await api.get(`/api/v1/dashboards/${id}`)
  return data as Dashboard
}

export async function createDashboard(payload: { name: string; layout?: DashboardLayout }): Promise<Dashboard> {
  const { data } = await api.post('/api/v1/dashboards', payload)
  return data as Dashboard
}

export async function updateDashboard(
  id: string,
  payload: { name?: string; layout?: DashboardLayout }
): Promise<Dashboard> {
  const { data } = await api.patch(`/api/v1/dashboards/${id}`, payload)
  return data as Dashboard
}

export async function shareDashboard(
  id: string,
  payload: { userId: string; canEdit?: boolean }
): Promise<DashboardPermission> {
  const { data } = await api.post(`/api/v1/dashboards/${id}/share`, payload)
  return data as DashboardPermission
}
