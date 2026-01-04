export type TenantSummary = {
  id: string
  name: string
  status?: 'Active' | 'Trial' | 'Suspended'
}

export type TenantUser = {
  id: string
  email: string
  name?: string | null
  role?: string
}

export type TenantBootstrap = {
  needsOnboarding?: boolean
  message?: string
  tenant?: {
    id: string
    name: string
  }
  user?: TenantUser
}
