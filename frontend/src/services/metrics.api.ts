import api from './http'
import type { Metric, MetricDefinition, MetricValue } from '../types/metric'

export async function listMetrics(): Promise<Metric[]> {
  const { data } = await api.get('/api/v1/metrics')
  return data as Metric[]
}

export async function getMetric(id: string): Promise<Metric> {
  const { data } = await api.get(`/api/v1/metrics/${id}`)
  return data as Metric
}

export async function getMetricValue(
  id: string,
  params: { range?: string; start?: string; end?: string } = {}
): Promise<MetricValue> {
  const { data } = await api.get(`/api/v1/metrics/${id}/value`, { params })
  return data as MetricValue
}

export async function createMetric(payload: {
  name: string
  datasetId: string
  definition: MetricDefinition
}): Promise<Metric> {
  const { data } = await api.post('/api/v1/metrics', payload)
  return data as Metric
}
