<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { AlertTriangle, Search } from 'lucide-vue-next'
import { listAdminTenants, listAdminUsers } from '../../services/admin.api'
import { listDataSources } from '../../services/dataSources.api'
import type { AdminTenant, AdminUser } from '../../types/admin'
import type { DataSource } from '../../types/dataSource'

const tenants = ref<AdminTenant[]>([])
const users = ref<AdminUser[]>([])
const dataSources = ref<DataSource[]>([])
const loading = ref(false)
const error = ref('')
const query = ref('')

const demoTenants: AdminTenant[] = [
  { id: 'demo-acme', name: 'Acme Corp', createdAt: new Date().toISOString() },
  { id: 'demo-tech', name: 'TechStart Inc', createdAt: new Date().toISOString() },
]

const demoTenantStats: Record<string, { status: 'Active' | 'Trial'; users: number; sources: number }> = {
  'demo-acme': { status: 'Active', users: 12, sources: 5 },
  'demo-tech': { status: 'Trial', users: 3, sources: 2 },
}

const demoUserCount = 15
const demoDataSourceCount = 7

const tenantsForView = computed(() => (tenants.value.length ? tenants.value : demoTenants))
const usersForView = computed(() => (users.value.length ? users.value : []))

const filteredTenants = computed(() => {
  if (!query.value.trim()) return tenantsForView.value
  const needle = query.value.toLowerCase()
  return tenantsForView.value.filter((tenant) => tenant.name.toLowerCase().includes(needle))
})

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const tenantStatus = (tenant: AdminTenant) => {
  return demoTenantStats[tenant.id]?.status ?? 'Active'
}

const tenantUsersCount = (tenant: AdminTenant) => {
  return demoTenantStats[tenant.id]?.users ?? '--'
}

const tenantSourcesCount = (tenant: AdminTenant) => {
  return demoTenantStats[tenant.id]?.sources ?? '--'
}

const totalTenants = computed(() => tenantsForView.value.length)
const totalUsers = computed(() => (usersForView.value.length ? usersForView.value.length : demoUserCount))
const totalDataSources = computed(() => (dataSources.value.length ? dataSources.value.length : demoDataSourceCount))
const activeTenants = computed(() =>
  tenantsForView.value.filter((tenant) => tenantStatus(tenant) === 'Active').length
)

const formatDate = (value: string) => dayjs(value).format('MMM D, YYYY')

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    const tenantResponse = await listAdminTenants({ pageSize: 50 })
    tenants.value = tenantResponse.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load admin tenants.'
  }
  try {
    const userResponse = await listAdminUsers({ pageSize: 200 })
    users.value = userResponse.data
  } catch {
    users.value = []
  }
  try {
    dataSources.value = await listDataSources()
  } catch {
    dataSources.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <section class="mx-auto w-full max-w-5xl">
    <div class="flex items-start gap-3">
      <div class="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-600">
        <AlertTriangle class="h-5 w-5" />
      </div>
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Platform Admin</h1>
        <p class="mt-1 text-sm text-slate-500">Manage all tenants and platform settings</p>
      </div>
    </div>

    <div class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
      Restricted Access
      <span class="ml-2 text-amber-600">This section is only accessible to platform owners. All actions are logged.</span>
    </div>

    <div class="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs text-slate-500">Total Tenants</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{{ totalTenants }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs text-slate-500">Total Users</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{{ totalUsers }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs text-slate-500">Data Sources</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{{ totalDataSources }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs text-slate-500">Active</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{{ activeTenants }}</p>
      </div>
    </div>

    <div class="mt-6">
      <div class="relative">
        <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          v-model="query"
          type="search"
          placeholder="Search tenants..."
          class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 shadow-sm"
        />
      </div>
    </div>

    <p v-if="error" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
      {{ error }} Using demo data for layout.
    </p>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="index in 3" :key="index" class="h-14 animate-pulse rounded-2xl bg-white shadow-sm" />
    </div>

    <div v-else class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-4 border-b border-slate-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        <span>Tenant</span>
        <span>Status</span>
        <span>Users</span>
        <span>Data Sources</span>
        <span>Created</span>
      </div>
      <div v-if="filteredTenants.length === 0" class="px-5 py-6 text-sm text-slate-500">
        No tenants found.
      </div>
      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="tenant in filteredTenants"
          :key="tenant.id"
          class="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-4 text-sm text-slate-700"
        >
          <div>
            <p class="font-semibold text-slate-900">{{ tenant.name }}</p>
            <p class="text-xs text-slate-500">/{{ slugify(tenant.name) }}</p>
          </div>
          <div>
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              :class="tenantStatus(tenant) === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'"
            >
              {{ tenantStatus(tenant) }}
            </span>
          </div>
          <div class="text-xs text-slate-600">{{ tenantUsersCount(tenant) }}</div>
          <div class="text-xs text-slate-600">{{ tenantSourcesCount(tenant) }}</div>
          <div class="text-xs text-slate-500">{{ formatDate(tenant.createdAt) }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
