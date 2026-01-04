import api from './http'
import type { DataSource, DataSourceConfig, DataSourceType } from '../types/dataSource'

export async function listDataSources(): Promise<DataSource[]> {
  const { data } = await api.get('/api/v1/data-sources')
  return data as DataSource[]
}

export async function getDataSource(id: string): Promise<DataSource> {
  const { data } = await api.get(`/api/v1/data-sources/${id}`)
  return data as DataSource
}

export async function createDataSource(payload: {
  name: string
  type: DataSourceType
  config: DataSourceConfig
}): Promise<DataSource> {
  const { data } = await api.post('/api/v1/data-sources', payload)
  return data as DataSource
}

export async function updateDataSource(
  id: string,
  payload: { name?: string; config?: DataSourceConfig }
): Promise<DataSource> {
  const { data } = await api.patch(`/api/v1/data-sources/${id}`, payload)
  return data as DataSource
}

export async function deleteDataSource(id: string): Promise<{ success: boolean }> {
  const { data } = await api.delete(`/api/v1/data-sources/${id}`)
  return data as { success: boolean }
}

export async function pollDataSource(id: string): Promise<{ ingested: number; errors: unknown[] }> {
  const { data } = await api.post(`/api/v1/data-sources/${id}/poll`)
  return data as { ingested: number; errors: unknown[] }
}
