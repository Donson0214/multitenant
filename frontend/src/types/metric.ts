export type MetricAggregation = 'sum' | 'avg' | 'count'

export type MetricFilter = {
  field: string
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  value: string | number | boolean
}

export type MetricDefinition = {
  expression?: string
  aggregation?: MetricAggregation
  field?: string
  filters?: MetricFilter[]
}

export type Metric = {
  id: string
  name: string
  datasetId: string
  definition: MetricDefinition
  createdAt: string
}

export type MetricValue = {
  id: string
  name: string
  value: number
  range: {
    start: string
    end: string
  }
}
