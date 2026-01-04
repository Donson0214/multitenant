import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { TenantSummary, TenantUser } from '../types/tenant'
import { getMe } from '../services/tenants.api'

const STORAGE_KEY = 'analytics-tenant'

const fallbackTenants: TenantSummary[] = [
  { id: 'demo-acme', name: 'Acme Corp', status: 'Active' },
  { id: 'demo-techstart', name: 'TechStart Inc', status: 'Trial' },
]

export const useTenantStore = defineStore('tenant', () => {
  const availableTenants = ref<TenantSummary[]>([])
  const activeTenantId = ref<string | null>(null)
  const user = ref<TenantUser | null>(null)
  const needsOnboarding = ref<boolean | null>(null)
  const hasBootstrapped = ref(false)
  const loading = ref(false)
  const error = ref('')
  let inFlight: Promise<void> | null = null

  if (typeof window !== 'undefined') {
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as {
        availableTenants?: TenantSummary[]
        activeTenantId?: string | null
      }
      if (cached.availableTenants?.length) {
        availableTenants.value = cached.availableTenants
      }
      if (cached.activeTenantId) {
        activeTenantId.value = cached.activeTenantId
      }
    } catch {
      // ignore cache errors
    }
  }

  if (!availableTenants.value.length) {
    availableTenants.value = fallbackTenants
  }

  const activeTenant = computed(() => {
    const tenants = availableTenants.value.length ? availableTenants.value : fallbackTenants
    if (activeTenantId.value) {
      return tenants.find((tenant) => tenant.id === activeTenantId.value) ?? tenants[0]
    }
    return tenants[0]
  })

  const persist = () => {
    if (typeof window === 'undefined') return
    const payload = {
      availableTenants: availableTenants.value,
      activeTenantId: activeTenantId.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  watch([availableTenants, activeTenantId], persist, { deep: true })

  const setActiveTenant = (tenantId: string) => {
    activeTenantId.value = tenantId
  }

  const bootstrap = async () => {
    if (inFlight) {
      await inFlight
      return needsOnboarding.value
    }
    inFlight = (async () => {
      loading.value = true
      error.value = ''
      try {
        const response = await getMe()
        needsOnboarding.value = Boolean(response.needsOnboarding)
        if (!response.needsOnboarding && response.tenant) {
          const tenantSummary: TenantSummary = {
            id: response.tenant.id,
            name: response.tenant.name,
            status: 'Active',
          }
          availableTenants.value = [
            tenantSummary,
            ...availableTenants.value.filter((tenant) => tenant.id !== tenantSummary.id),
          ]
          activeTenantId.value = tenantSummary.id
          user.value = response.user ?? null
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unable to load tenant context.'
        needsOnboarding.value = null
      } finally {
        loading.value = false
        hasBootstrapped.value = true
      }
    })()
    await inFlight
    inFlight = null
    return needsOnboarding.value
  }

  return {
    availableTenants,
    activeTenant,
    activeTenantId,
    user,
    needsOnboarding,
    hasBootstrapped,
    loading,
    error,
    bootstrap,
    setActiveTenant,
  }
})
