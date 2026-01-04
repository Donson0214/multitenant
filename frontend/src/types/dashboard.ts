export type DashboardWidgetType = 'kpi' | 'line' | 'bar' | 'table'

export type DashboardWidget = {
  id?: string
  type: DashboardWidgetType
  title?: string
  metricId?: string
  datasetId?: string
  description?: string
}

export type DashboardLayout = {
  widgets?: DashboardWidget[]
  visibility?: 'public' | 'private'
}

export type Dashboard = {
  id: string
  name: string
  layout: DashboardLayout
  createdAt: string
}

export type DashboardPermission = {
  id: string
  userId: string
  canEdit: boolean
}
