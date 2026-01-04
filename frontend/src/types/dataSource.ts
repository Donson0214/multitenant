export type DataSourceType = 'CSV' | 'WEBHOOK' | 'REST_POLL'

export type DataSourceConfig = {
  datasetId: string
  fieldMapping: Record<string, string>
  dateField?: string
  webhookSecret?: string
  restEndpoint?: string
}

export type DataSource = {
  id: string
  name: string
  type: DataSourceType
  config: DataSourceConfig
  createdAt: string
}
