<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { LayoutGrid, LayoutList, Search, Plus } from 'lucide-vue-next'
import { listDashboards, createDashboard } from '../../../services/dashboards.api'
import type { Dashboard } from '../../../types/dashboard'
import { useUiStore } from '../../../stores/ui.store'
import { formatShortDate } from '../../../utils/dates'

const ui = useUiStore()
const dashboards = ref<Dashboard[]>([])
const loading = ref(false)
const error = ref('')
const query = ref('')

const demoDashboards: Dashboard[] = [
  {
    id: 'demo-1',
    name: 'Revenue Overview',
    layout: { widgets: [{ type: 'kpi' }, { type: 'line' }], visibility: 'private' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    name: 'User Engagement',
    layout: { widgets: [{ type: 'kpi' }, { type: 'line' }], visibility: 'public' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    name: 'Product Analytics',
    layout: { widgets: [{ type: 'kpi' }, { type: 'bar' }] },
    createdAt: new Date().toISOString(),
  },
]

const filteredDashboards = computed(() => {
  const source = dashboards.value.length ? dashboards.value : demoDashboards
  if (!query.value.trim()) return source
  const needle = query.value.toLowerCase()
  return source.filter((dashboard) => dashboard.name.toLowerCase().includes(needle))
})

const loadDashboards = async () => {
  loading.value = true
  error.value = ''
  try {
    dashboards.value = await listDashboards()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load dashboards.'
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  const name = window.prompt('Name your dashboard')
  if (!name) return
  try {
    const created = await createDashboard({ name, layout: { widgets: [] } })
    dashboards.value = [created, ...dashboards.value]
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to create dashboard.'
  }
}

onMounted(() => {
  loadDashboards()
})
</script>

<template>
  <section class="mx-auto w-full max-w-5xl">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Dashboards</h1>
        <p class="mt-1 text-sm text-slate-500">Visualize your metrics and track performance</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
        @click="handleCreate"
      >
        <Plus class="h-4 w-4" />
        Create Dashboard
      </button>
    </div>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <div class="relative flex min-w-[240px] flex-1 items-center">
        <Search class="absolute left-3 h-4 w-4 text-slate-400" />
        <input
          v-model="query"
          type="search"
          placeholder="Search dashboards..."
          class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 shadow-sm"
        />
      </div>
      <div class="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition"
          :class="ui.viewMode === 'grid' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'"
          @click="ui.setViewMode('grid')"
        >
          <LayoutGrid class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition"
          :class="ui.viewMode === 'list' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'"
          @click="ui.setViewMode('list')"
        >
          <LayoutList class="h-4 w-4" />
        </button>
      </div>
    </div>

    <p v-if="error" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
      {{ error }} Use a valid API token to load real dashboards.
    </p>

    <div v-if="loading" class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="index in 3" :key="index" class="h-36 animate-pulse rounded-2xl bg-white shadow-sm" />
    </div>

    <div v-else class="mt-6">
      <div v-if="filteredDashboards.length === 0" class="rounded-2xl border border-slate-200 bg-white p-6">
        <p class="text-sm text-slate-500">No dashboards match your search.</p>
      </div>

      <div
        v-else
        :class="
          ui.viewMode === 'grid'
            ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
            : 'flex flex-col gap-3'
        "
      >
        <RouterLink
          v-for="dashboard in filteredDashboards"
          :key="dashboard.id"
          :to="`/analytics/dashboards/${dashboard.id}`"
          class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
          :class="ui.viewMode === 'list' ? 'flex items-center justify-between' : ''"
        >
          <div class="flex items-start gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <LayoutGrid class="h-5 w-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-semibold text-slate-900">{{ dashboard.name }}</h3>
                <span
                  v-if="dashboard.layout?.visibility === 'public'"
                  class="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500"
                >
                  Public
                </span>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                {{ dashboard.layout?.widgets?.length ?? 0 }} widgets
              </p>
            </div>
          </div>
          <div class="mt-4 flex items-center justify-between text-xs text-slate-400 md:mt-0">
            <span>Updated {{ formatShortDate(dashboard.createdAt) }}</span>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
