export type DatasetRecord = {
  id: string
  eventTime: string
  data: Record<string, unknown>
}

export type DatasetSchema = {
  dateField: string
  fields: Record<string, string>
}

export type Dataset = {
  id: string
  name: string
  schema: DatasetSchema
  createdAt: string
}

export type DatasetRecordResponse = {
  data: DatasetRecord[]
  page: number
  pageSize: number
}
