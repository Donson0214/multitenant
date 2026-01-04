import type { Router } from 'vue-router'
import type { Pinia } from 'pinia'
import { getAuthToken } from '../services/http'
import { useTenantStore } from '../stores/tenant.store'

const protectedPrefixes = ['/analytics', '/admin']
const publicRouteNames = new Set(['login', 'register'])

export const registerGuards = (router: Router, pinia: Pinia) => {
  router.beforeEach(async (to) => {
    const hasToken = Boolean(getAuthToken())
    const tenantStore = useTenantStore(pinia)

    if (publicRouteNames.has(String(to.name))) {
      if (hasToken) {
        return '/analytics/dashboards'
      }
      return true
    }

    if (protectedPrefixes.some((prefix) => to.path.startsWith(prefix)) || to.path === '/onboarding') {
      if (!hasToken) {
        return '/login'
      }
      if (!tenantStore.hasBootstrapped && !tenantStore.loading) {
        await tenantStore.bootstrap()
      }
      if (tenantStore.needsOnboarding && to.path !== '/onboarding') {
        return '/onboarding'
      }
      if (tenantStore.needsOnboarding === false && to.path === '/onboarding') {
        return '/analytics/dashboards'
      }
    }

    return true
  })
}
