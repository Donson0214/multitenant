<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import {
  ArrowLeft,
  Share2,
  Presentation,
  Settings2,
  Search,
  X,
} from 'lucide-vue-next'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { useRouter } from 'vue-router'
import { getDashboard, shareDashboard } from '../../../../services/dashboards.api'
import { getMetric, getMetricValue } from '../../../../services/metrics.api'
import { listDatasetRecords } from '../../../../services/datasets.api'
import { listUsers } from '../../../../services/users.api'
import type { Dashboard, DashboardWidget } from '../../../../types/dashboard'
import type { Metric } from '../../../../types/metric'
import type { DatasetRecord } from '../../../../types/dataset'
import type { AppUser } from '../../../../types/user'
import { formatCompactNumber, formatCurrency } from '../../../../utils/formatters'
import { buildRangeQuery, resolveDateRange, resolvePreviousRange } from '../../../../utils/dates'
import { useUiStore } from '../../../../stores/ui.store'
import KpiCard from '../../../../components/charts/KpiCard.vue'
import LineChart from '../../../../components/charts/LineChart.vue'
import BarChart from '../../../../components/charts/BarChart.vue'
import TableChart from '../../../../components/charts/TableChart.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const ui = useUiStore()

const dashboard = ref<Dashboard | null>(null)
const loading = ref(false)
const error = ref('')
const rangeLoading = ref(false)
const demoMode = ref(false)

const metricCache = reactive<Record<string, Metric>>({})
const metricValueCache = reactive<Record<string, number | null>>({})
const metricChangeCache = reactive<Record<string, string | null>>({})
const recordsCache = reactive<Record<string, DatasetRecord[]>>({})

const shareOpen = ref(false)
const shareLoading = ref(false)
const shareError = ref('')
const shareSuccess = ref('')
const shareUsers = ref<AppUser[]>([])
const shareQuery = ref('')
const selectedUserId = ref('')
const canEdit = ref(false)

const demoDashboard: Dashboard = {
  id: 'demo-1',
  name: 'Revenue Overview',
  layout: {
    widgets: [
      { type: 'kpi', title: 'Total Revenue', metricId: 'demo-metric' },
      { type: 'line', title: 'Revenue Trend', metricId: 'demo-metric' },
      { type: 'bar', title: 'Revenue by Product', metricId: 'demo-metric' },
    ],
  },
  createdAt: new Date().toISOString(),
}

const demoMetric: Metric = {
  id: 'demo-metric',
  name: 'Total Revenue',
  datasetId: 'demo-dataset',
  definition: { aggregation: 'sum', field: 'amount' },
  createdAt: new Date().toISOString(),
}

const demoAmounts = Array.from({ length: 30 }, (_, index) => {
  const base = 38000
  const wave = (index % 6) * 1800
  const dip = (index % 4) * 900
  return base + wave - dip
})
const demoProducts = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E']
const demoRecords: DatasetRecord[] = demoAmounts.map((amount, index) => ({
  id: `demo-${index}`,
  eventTime: dayjs().subtract(demoAmounts.length - 1 - index, 'day').toISOString(),
  data: {
    amount,
    product: demoProducts[index % demoProducts.length],
  },
}))

const demoUsers: AppUser[] = [
  { id: 'demo-user-1', name: 'Alex Chen', email: 'alex@acme.com', role: 'OWNER' },
  { id: 'demo-user-2', name: 'Priya Singh', email: 'priya@acme.com', role: 'ANALYST' },
  { id: 'demo-user-3', name: 'Jin Park', email: 'jin@acme.com', role: 'VIEWER' },
]

const widgets = computed(() => dashboard.value?.layout?.widgets ?? [])
const selectedUser = computed(() =>
  shareUsers.value.find((user) => user.id === selectedUserId.value)
)
const filteredUsers = computed(() => {
  if (!shareQuery.value.trim()) {
    return shareUsers.value
  }
  const needle = shareQuery.value.toLowerCase()
  return shareUsers.value.filter((user) => {
    const name = user.name?.toLowerCase() ?? ''
    return name.includes(needle) || user.email.toLowerCase().includes(needle)
  })
})

const userInitials = (user: AppUser) => {
  const source = user.name?.trim() || user.email
  return source.slice(0, 2).toUpperCase()
}

const getMetricForWidget = (widget: DashboardWidget) => {
  if (widget.metricId && metricCache[widget.metricId]) {
    return metricCache[widget.metricId]
  }
  return null
}

const getRecordsForWidget = (widget: DashboardWidget) => {
  if (widget.datasetId) {
    return recordsCache[widget.datasetId] ?? []
  }
  if (widget.metricId && metricCache[widget.metricId]) {
    const datasetId = metricCache[widget.metricId].datasetId
    return recordsCache[datasetId] ?? []
  }
  return []
}

const formatMetricValue = (metric: Metric | null, value: number | null) => {
  if (value === null || value === undefined) return '--'
  const name = metric?.name?.toLowerCase() ?? ''
  if (name.includes('revenue') || name.includes('sales') || name.includes('amount')) {
    return formatCurrency(value)
  }
  return formatCompactNumber(value)
}

const aggregateValues = (values: number[], aggregation: Metric['definition']['aggregation']) => {
  if (!aggregation || !values.length) return 0
  if (aggregation === 'count') return values.length
  const sum = values.reduce((acc, value) => acc + value, 0)
  if (aggregation === 'avg') return sum / values.length
  return sum
}

const buildTimeSeries = (records: DatasetRecord[], metric: Metric | null) => {
  if (!records.length || !metric || !metric.definition.aggregation) return { labels: [], data: [] }
  const field = metric.definition.field
  const aggregation = metric.definition.aggregation
  const buckets = new Map<string, number[]>()
  records.forEach((record) => {
    const key = dayjs(record.eventTime).format('YYYY-MM-DD')
    if (!buckets.has(key)) buckets.set(key, [])
    const value =
      aggregation === 'count'
        ? 1
        : Number((record.data as Record<string, unknown>)[field ?? ''])
    if (Number.isFinite(value)) {
      buckets.get(key)?.push(value)
    }
  })
  const labels = Array.from(buckets.keys()).sort()
  const data = labels.map((label) => {
    const values = buckets.get(label) ?? []
    return aggregateValues(values, aggregation)
  })
  return { labels, data }
}

const findCategoryField = (records: DatasetRecord[], metric: Metric | null) => {
  const sample = records[0]?.data as Record<string, unknown> | undefined
  if (!sample) return ''
  const metricField = metric?.definition.field
  return (
    Object.keys(sample).find(
      (key) => typeof sample[key] === 'string' && key !== metricField
    ) ?? ''
  )
}

const buildCategorySeries = (records: DatasetRecord[], metric: Metric | null) => {
  if (!records.length || !metric || !metric.definition.aggregation) return { labels: [], data: [] }
  const categoryField = findCategoryField(records, metric)
  if (!categoryField) {
    return buildTimeSeries(records, metric)
  }
  const aggregation = metric.definition.aggregation
  const buckets = new Map<string, number[]>()
  records.forEach((record) => {
    const category = String((record.data as Record<string, unknown>)[categoryField] ?? 'Other')
    if (!buckets.has(category)) buckets.set(category, [])
    const value =
      aggregation === 'count'
        ? 1
        : Number((record.data as Record<string, unknown>)[metric.definition.field ?? ''])
    if (Number.isFinite(value)) {
      buckets.get(category)?.push(value)
    }
  })
  const labels = Array.from(buckets.keys())
  const data = labels.map((label) => {
    const values = buckets.get(label) ?? []
    return aggregateValues(values, aggregation)
  })
  return { labels, data }
}

const tableColumns = (records: DatasetRecord[]) => {
  const sample = records[0]?.data as Record<string, unknown> | undefined
  if (!sample) return []
  return Object.keys(sample)
    .slice(0, 4)
    .map((key) => ({ key, label: key }))
}

const tableRows = (records: DatasetRecord[]) => {
  return records.slice(0, 5).map((record) => {
    return record.data as Record<string, string | number>
  })
}

const applyDemoRange = () => {
  const range = resolveDateRange(ui.dateRange, ui.customStart, ui.customEnd)
  const previousRange = resolvePreviousRange(ui.dateRange, ui.customStart, ui.customEnd)

  const filterByRange = (records: DatasetRecord[], start: Dayjs, end: Dayjs) =>
    records.filter((record) => {
      const timestamp = dayjs(record.eventTime)
      return !timestamp.isBefore(start) && !timestamp.isAfter(end)
    })

  const currentRecords = filterByRange(demoRecords, range.start, range.end)
  const previousRecords = filterByRange(demoRecords, previousRange.start, previousRange.end)
  const currentValue = currentRecords.reduce((sum, record) => sum + Number(record.data.amount), 0)
  const previousValue = previousRecords.reduce((sum, record) => sum + Number(record.data.amount), 0)

  metricCache[demoMetric.id] = demoMetric
  recordsCache[demoMetric.datasetId] = currentRecords
  metricValueCache[demoMetric.id] = currentValue
  if (previousValue > 0) {
    const change = ((currentValue - previousValue) / previousValue) * 100
    metricChangeCache[demoMetric.id] = `${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs last period`
  } else {
    metricChangeCache[demoMetric.id] = '+12.5% vs last period'
  }
}

const loadDashboard = async () => {
  loading.value = true
  error.value = ''
  demoMode.value = false
  try {
    dashboard.value = await getDashboard(props.id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load dashboard.'
    dashboard.value = demoDashboard
    demoMode.value = true
  } finally {
    loading.value = false
  }
  await hydrateMetrics()
  await refreshRangeData()
}

const hydrateMetrics = async () => {
  const metricIds = Array.from(
    new Set(widgets.value.map((widget) => widget.metricId).filter(Boolean) as string[])
  )
  await Promise.all(
    metricIds.map(async (metricId) => {
      if (!metricCache[metricId]) {
        try {
          metricCache[metricId] = await getMetric(metricId)
        } catch {
          // ignore missing metrics
        }
      }
    })
  )
}

const refreshRangeData = async () => {
  if (!dashboard.value) return
  if (demoMode.value) {
    rangeLoading.value = true
    applyDemoRange()
    rangeLoading.value = false
    return
  }
  rangeLoading.value = true
  const metricIds = Array.from(
    new Set(widgets.value.map((widget) => widget.metricId).filter(Boolean) as string[])
  )
  const datasetIds = new Set<string>()
  const rangeParams = buildRangeQuery(ui.dateRange, ui.customStart, ui.customEnd)
  const previousRange = resolvePreviousRange(ui.dateRange, ui.customStart, ui.customEnd)
  const kpiMetricIds = new Set(
    widgets.value.filter((widget) => widget.type === 'kpi').map((widget) => widget.metricId)
  )

  await Promise.all(
    metricIds.map(async (metricId) => {
      try {
        const valueResponse = await getMetricValue(metricId, rangeParams)
        metricValueCache[metricId] = valueResponse.value
        if (kpiMetricIds.has(metricId)) {
          const previous = await getMetricValue(metricId, {
            range: 'custom',
            start: previousRange.start.toISOString(),
            end: previousRange.end.toISOString(),
          })
          const currentValue = valueResponse.value
          const previousValue = previous.value
          if (Number.isFinite(currentValue) && Number.isFinite(previousValue) && previousValue !== 0) {
            const change = ((currentValue - previousValue) / previousValue) * 100
            metricChangeCache[metricId] = `${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs last period`
          } else {
            metricChangeCache[metricId] = null
          }
        }
      } catch {
        metricValueCache[metricId] = null
      }
    })
  )

  widgets.value.forEach((widget) => {
    if (['line', 'bar', 'table'].includes(widget.type)) {
      if (widget.datasetId) {
        datasetIds.add(widget.datasetId)
      } else if (widget.metricId && metricCache[widget.metricId]) {
        datasetIds.add(metricCache[widget.metricId].datasetId)
      }
    }
  })

  await Promise.all(
    Array.from(datasetIds).map(async (datasetId) => {
      try {
        const recordsResponse = await listDatasetRecords(datasetId, {
          ...rangeParams,
          pageSize: 200,
        })
        recordsCache[datasetId] = recordsResponse.data
      } catch {
        recordsCache[datasetId] = []
      }
    })
  )
  rangeLoading.value = false
}

const openShare = async () => {
  shareOpen.value = true
  shareError.value = ''
  shareSuccess.value = ''
  if (!shareUsers.value.length) {
    await loadShareUsers()
  }
}

const loadShareUsers = async () => {
  shareLoading.value = true
  shareError.value = ''
  try {
    shareUsers.value = await listUsers()
  } catch (err) {
    shareError.value = err instanceof Error ? err.message : 'Unable to load users.'
    shareUsers.value = demoUsers
  } finally {
    shareLoading.value = false
    if (!selectedUserId.value && shareUsers.value.length) {
      selectedUserId.value = shareUsers.value[0].id
    }
  }
}

const handleShare = async () => {
  shareError.value = ''
  shareSuccess.value = ''
  if (!selectedUserId.value) {
    shareError.value = 'Select a user to share with.'
    return
  }
  shareLoading.value = true
  try {
    await shareDashboard(props.id, { userId: selectedUserId.value, canEdit: canEdit.value })
    shareSuccess.value = `Shared with ${selectedUser.value?.name ?? selectedUser.value?.email}.`
  } catch (err) {
    shareError.value = err instanceof Error ? err.message : 'Unable to share dashboard.'
  } finally {
    shareLoading.value = false
  }
}

const widgetClass = (widget: DashboardWidget) => {
  if (widget.type === 'line') return 'lg:col-span-2'
  if (widget.type === 'table') return 'lg:col-span-3'
  return ''
}

onMounted(() => {
  loadDashboard()
})

watch(
  () => [ui.dateRange, ui.customStart, ui.customEnd],
  () => {
    refreshRangeData()
  }
)

watch(shareOpen, (open) => {
  if (!open) {
    shareQuery.value = ''
    canEdit.value = false
  }
})
</script>

<template>
  <section class="mx-auto w-full max-w-6xl">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-start gap-3">
        <button
          type="button"
          class="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm"
          @click="router.push('/analytics/dashboards')"
        >
          <ArrowLeft class="h-4 w-4" />
        </button>
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">{{ dashboard?.name ?? 'Dashboard' }}</h1>
          <p class="mt-1 text-sm text-slate-500">Track revenue metrics and trends</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
        >
          <Presentation class="h-4 w-4" />
          Present
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
          @click="openShare"
        >
          <Share2 class="h-4 w-4" />
          Share
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-md"
        >
          <Settings2 class="h-4 w-4" />
          Edit Dashboard
        </button>
      </div>
    </div>

    <p v-if="error" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
      {{ error }} Showing demo data for layout.
    </p>

    <div v-if="loading" class="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="index in 3" :key="index" class="h-48 animate-pulse rounded-2xl bg-white shadow-sm" />
    </div>

    <div v-else class="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <template v-for="(widget, index) in widgets" :key="`${widget.type}-${index}`">
        <KpiCard
          v-if="widget.type === 'kpi'"
          :class="widgetClass(widget)"
          :title="widget.title ?? 'Metric'"
          :value="formatMetricValue(getMetricForWidget(widget), metricValueCache[widget.metricId ?? ''] ?? null)"
          :change="metricChangeCache[widget.metricId ?? ''] ?? undefined"
          :live="true"
          :loading="rangeLoading"
        />

        <div
          v-else
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          :class="widgetClass(widget)"
        >
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-slate-900">
                {{ widget.title ?? 'Widget' }}
              </h3>
              <p v-if="widget.description" class="mt-1 text-xs text-slate-500">
                {{ widget.description }}
              </p>
            </div>
          </div>

          <LineChart
            v-if="widget.type === 'line'"
            :labels="buildTimeSeries(getRecordsForWidget(widget), getMetricForWidget(widget)).labels"
            :datasets="[
              {
                label: widget.title ?? 'Trend',
                data: buildTimeSeries(getRecordsForWidget(widget), getMetricForWidget(widget)).data,
              },
            ]"
            :loading="rangeLoading"
          />

          <BarChart
            v-else-if="widget.type === 'bar'"
            :labels="buildCategorySeries(getRecordsForWidget(widget), getMetricForWidget(widget)).labels"
            :datasets="[
              {
                label: widget.title ?? 'Breakdown',
                data: buildCategorySeries(getRecordsForWidget(widget), getMetricForWidget(widget)).data,
              },
            ]"
            :loading="rangeLoading"
          />

          <TableChart
            v-else-if="widget.type === 'table'"
            :columns="tableColumns(getRecordsForWidget(widget))"
            :rows="tableRows(getRecordsForWidget(widget))"
          />

          <div v-else class="text-sm text-slate-500">Unsupported widget type.</div>
        </div>
      </template>
    </div>

    <TransitionRoot :show="shareOpen" as="template">
      <Dialog class="relative z-50" @close="shareOpen = false">
        <TransitionChild
          as="template"
          enter="ease-out duration-200"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-150"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-slate-900/40" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as="template"
              enter="ease-out duration-200"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="ease-in duration-150"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl">
                <div class="flex items-start justify-between">
                  <div>
                    <DialogTitle class="text-lg font-semibold text-slate-900">
                      Share Dashboard
                    </DialogTitle>
                    <p class="mt-1 text-sm text-slate-500">
                      Invite teammates with view or edit access.
                    </p>
                  </div>
                  <button
                    type="button"
                    class="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                    @click="shareOpen = false"
                  >
                    <X class="h-4 w-4" />
                  </button>
                </div>

                <div class="mt-4">
                  <label class="text-xs font-semibold text-slate-500">Select user</label>
                  <div class="relative mt-2">
                    <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      v-model="shareQuery"
                      type="search"
                      placeholder="Search by name or email"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700"
                    />
                  </div>

                  <div class="mt-3 max-h-48 space-y-2 overflow-auto pr-1">
                    <button
                      v-for="user in filteredUsers"
                      :key="user.id"
                      type="button"
                      class="flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition"
                      :class="
                        selectedUserId === user.id
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      "
                      @click="selectedUserId = user.id"
                    >
                      <div class="flex items-center gap-3">
                        <span class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {{ userInitials(user) }}
                        </span>
                        <div>
                          <p class="text-sm font-semibold text-slate-800">{{ user.name ?? user.email }}</p>
                          <p class="text-xs text-slate-500">{{ user.email }}</p>
                        </div>
                      </div>
                      <span class="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        {{ user.role ?? 'Member' }}
                      </span>
                    </button>
                    <p v-if="!filteredUsers.length && !shareLoading" class="text-sm text-slate-500">
                      No users found.
                    </p>
                    <p v-if="shareLoading" class="text-sm text-slate-500">Loading users...</p>
                  </div>
                </div>

                <div class="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p class="text-sm font-semibold text-slate-800">Can edit</p>
                    <p class="text-xs text-slate-500">Allow edits to widgets and layout.</p>
                  </div>
                  <input v-model="canEdit" type="checkbox" class="h-4 w-4 accent-blue-600" />
                </div>

                <div class="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3">
                  <p class="text-sm font-semibold text-slate-800">Public link</p>
                  <p class="text-xs text-slate-500">Read-only links are coming soon.</p>
                </div>

                <p v-if="shareError" class="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {{ shareError }} Connect a valid API token to use live data.
                </p>
                <p v-if="shareSuccess" class="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {{ shareSuccess }}
                </p>

                <div class="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
                    @click="shareOpen = false"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
                    :disabled="shareLoading"
                    @click="handleShare"
                  >
                    {{ shareLoading ? 'Sharing...' : 'Share' }}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </section>
</template>
