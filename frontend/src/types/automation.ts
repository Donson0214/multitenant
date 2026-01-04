export type AutomationCondition = {
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'
  threshold: number
  range?: string
  start?: string
  end?: string
}

export type AutomationAction = {
  type: 'EMAIL' | 'IN_APP' | 'WEBHOOK'
  target?: string
  title?: string
  message?: string
}

export type AutomationRule = {
  id: string
  name: string
  metricId: string
  condition: AutomationCondition
  action: AutomationAction
  status: 'ENABLED' | 'DISABLED'
  createdAt: string
}

export type AutomationRun = {
  id: string
  ruleId: string
  status: 'SUCCESS' | 'FAILED'
  createdAt: string
  windowStart: string
  windowEnd?: string | null
}
