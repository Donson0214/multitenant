import api from './http'
import type { AutomationRule, AutomationRun } from '../types/automation'

export async function listAutomations(): Promise<AutomationRule[]> {
  const { data } = await api.get('/api/v1/automations')
  return data as AutomationRule[]
}

export async function getAutomation(id: string): Promise<AutomationRule> {
  const { data } = await api.get(`/api/v1/automations/${id}`)
  return data as AutomationRule
}

export async function createAutomation(payload: {
  name: string
  metricId: string
  condition: AutomationRule['condition']
  action: AutomationRule['action']
}): Promise<AutomationRule> {
  const { data } = await api.post('/api/v1/automations', payload)
  return data as AutomationRule
}

export async function runAutomation(id: string): Promise<{ run: AutomationRun; triggered: boolean }> {
  const { data } = await api.post(`/api/v1/automations/${id}/run`)
  return data as { run: AutomationRun; triggered: boolean }
}

export async function listAutomationRuns(params: {
  ruleId?: string
  page?: number
  pageSize?: number
} = {}): Promise<{ data: AutomationRun[]; page: number; pageSize: number }> {
  const { data } = await api.get('/api/v1/automations/runs', { params })
  return data as { data: AutomationRun[]; page: number; pageSize: number }
}
