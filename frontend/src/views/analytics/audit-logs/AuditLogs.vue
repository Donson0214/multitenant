<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { ChevronDown, Filter } from 'lucide-vue-next'
import { listAuditLogs } from '../../../services/auditLogs.api'
import { listUsers } from '../../../services/users.api'
import type { AuditLog } from '../../../types/auditLog'
import type { AppUser } from '../../../types/user'

const logs = ref<AuditLog[]>([])
const users = ref<AppUser[]>([])
const loading = ref(false)
const error = ref('')
const actionFilter = ref('')

const demoUsers: AppUser[] = [
  { id: 'demo-u1', name: 'Alex Chen', email: 'alex.chen@acmecorp.com', role: 'OWNER' },
  { id: 'demo-u2', name: 'Sarah Johnson', email: 'sarah.j@acmecorp.com', role: 'ADMIN' },
  { id: 'demo-u3', name: 'Michael Brown', email: 'michael.b@acmecorp.com', role: 'ANALYST' },
]

const demoLogs: AuditLog[] = [
  {
    id: 'demo-log-1',
    actorUserId: 'demo-u1',
    action: 'DASHBOARD_CREATED',
    entityType: 'Dashboard',
    entityId: 'dash-1',
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
  },
  {
    id: 'demo-log-2',
    actorUserId: 'demo-u2',
    action: 'METRIC_UPDATED',
    entityType: 'Metric',
    entityId: 'metric-1',
    createdAt: dayjs().subtract(4, 'hour').toISOString(),
  },
  {
    id: 'demo-log-3',
    actorUserId: 'demo-u1',
    action: 'USER_ADDED',
    entityType: 'User',
    entityId: 'user-5',
    createdAt: dayjs().subtract(6, 'hour').toISOString(),
  },
  {
    id: 'demo-log-4',
    actorUserId: 'demo-u3',
    action: 'WIDGET_DELETED',
    entityType: 'Widget',
    entityId: 'widget-old-1',
    createdAt: dayjs().subtract(1, 'day').toISOString(),
  },
  {
    id: 'demo-log-5',
    actorUserId: 'demo-u1',
    action: 'AUTOMATION_ENABLED',
    entityType: 'Automation',
    entityId: 'auto-1',
    createdAt: dayjs().subtract(2, 'day').toISOString(),
  },
  {
    id: 'demo-log-6',
    actorUserId: 'demo-u2',
    action: 'DATA_SOURCE_CONNECTED',
    entityType: 'Data Source',
    entityId: 'ds-5',
    createdAt: dayjs().subtract(3, 'day').toISOString(),
  },
]

const logsForView = computed(() => (logs.value.length ? logs.value : demoLogs))
const usersForView = computed(() => (users.value.length ? users.value : demoUsers))

const filteredLogs = computed(() => {
  if (!actionFilter.value) return logsForView.value
  return logsForView.value.filter((log) => log.action === actionFilter.value)
})

const userMap = computed(() => new Map(usersForView.value.map((user) => [user.id, user])))

const actions = computed(() => {
  const set = new Set(logsForView.value.map((log) => log.action))
  return Array.from(set)
})

const formatAction = (value: string) => value.toLowerCase().replace(/_/g, ' ')

const badgeClass = (action: string) => {
  const label = formatAction(action)
  if (label.includes('created') || label.includes('enabled')) {
    return 'bg-emerald-100 text-emerald-600'
  }
  if (label.includes('updated') || label.includes('connected')) {
    return 'bg-blue-100 text-blue-600'
  }
  if (label.includes('deleted') || label.includes('removed')) {
    return 'bg-rose-100 text-rose-600'
  }
  if (label.includes('invited') || label.includes('added')) {
    return 'bg-purple-100 text-purple-600'
  }
  return 'bg-slate-100 text-slate-600'
}

const formatTimestamp = (value: string) => dayjs(value).format('MMM D, YYYY h:mm A')

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await listAuditLogs({ action: actionFilter.value || undefined, pageSize: 50 })
    logs.value = response.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load audit logs.'
  }
  try {
    users.value = await listUsers()
  } catch {
    users.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

watch(actionFilter, () => {
  if (logs.value.length) {
    loadData()
  }
})
</script>

<template>
  <section class="mx-auto w-full max-w-5xl">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Audit Logs</h1>
        <p class="mt-1 text-sm text-slate-500">Track all actions and changes in your workspace</p>
      </div>
      <div class="relative">
        <Filter class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <select
          v-model="actionFilter"
          class="rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 shadow-sm"
        >
          <option value="">All Actions</option>
          <option v-for="action in actions" :key="action" :value="action">
            {{ formatAction(action) }}
          </option>
        </select>
        <ChevronDown class="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
      </div>
    </div>

    <p v-if="error" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
      {{ error }} Using demo data for layout.
    </p>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="index in 5" :key="index" class="h-14 animate-pulse rounded-2xl bg-white shadow-sm" />
    </div>

    <div v-else class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="grid grid-cols-[1.4fr_1fr_1.4fr_1fr] gap-4 border-b border-slate-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        <span>Actor</span>
        <span>Action</span>
        <span>Entity</span>
        <span>Timestamp</span>
      </div>
      <div v-if="filteredLogs.length === 0" class="px-5 py-6 text-sm text-slate-500">
        No audit logs yet.
      </div>
      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="log in filteredLogs"
          :key="log.id"
          class="grid grid-cols-[1.4fr_1fr_1.4fr_1fr] gap-4 px-5 py-4 text-sm text-slate-700"
        >
          <div class="flex items-center gap-3">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              {{ (userMap.get(log.actorUserId)?.name ?? userMap.get(log.actorUserId)?.email ?? 'NA').slice(0, 2).toUpperCase() }}
            </span>
            <div>
              <p class="text-sm font-semibold text-slate-900">
                {{ userMap.get(log.actorUserId)?.name ?? userMap.get(log.actorUserId)?.email ?? 'Unknown' }}
              </p>
              <p class="text-xs text-slate-500">{{ userMap.get(log.actorUserId)?.email ?? log.actorUserId }}</p>
            </div>
          </div>
          <div>
            <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold" :class="badgeClass(log.action)">
              {{ formatAction(log.action) }}
            </span>
          </div>
          <div class="text-xs text-slate-600">
            {{ log.entityType }}
            <span v-if="log.entityId" class="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
              {{ log.entityId }}
            </span>
          </div>
          <div class="text-xs text-slate-500">{{ formatTimestamp(log.createdAt) }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
