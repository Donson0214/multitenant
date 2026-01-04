export type AdminTenant = {
  id: string
  name: string
  createdAt: string
}

export type AdminUser = {
  id: string
  email: string
  name?: string | null
  createdAt: string
}

export type AdminListResponse<T> = {
  data: T[]
  page: number
  pageSize: number
}
