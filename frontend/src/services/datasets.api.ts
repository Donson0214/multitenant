import api from './http'
import type { Dataset, DatasetRecordResponse } from '../types/dataset'

export async function listDatasetRecords(
  datasetId: string,
  params: { range?: string; start?: string; end?: string; page?: number; pageSize?: number } = {}
): Promise<DatasetRecordResponse> {
  const { data } = await api.get(`/api/v1/datasets/${datasetId}/records`, { params })
  return data as DatasetRecordResponse
}

export async function listDatasets(): Promise<Dataset[]> {
  const { data } = await api.get('/api/v1/datasets')
  return data as Dataset[]
}
