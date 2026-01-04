<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { Search, Table2 } from 'lucide-vue-next'
import { listDatasets, listDatasetRecords } from '../../../services/datasets.api'
import { listDataSources } from '../../../services/dataSources.api'
import type { Dataset } from '../../../types/dataset'
import type { DataSource } from '../../../types/dataSource'
import { formatNumber } from '../../../utils/formatters'

const datasets = ref<Dataset[]>([])
const dataSources = ref<DataSource[]>([])
const loading = ref(false)
const error = ref('')
const query = ref('')

const recordsMeta = reactive<Record<string, { count: number; hasMore: boolean; lastUpdated?: string }>>({})

const demoDatasets: Dataset[] = [
  {
    id: 'demo-ds-1',
    name: 'customer_events',
    schema: {
      dateField: 'timestamp',
      fields: {
        event_id: 'string',
        user_id: 'string',
        event_type: 'string',
        timestamp: 'date',
        device: 'string',
        source: 'string',
      },
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-ds-2',
    name: 'sales_transactions',
    schema: {
      dateField: 'timestamp',
      fields: {
        transaction_id: 'string',
        customer_id: 'string',
        amount: 'number',
        currency: 'string',
        timestamp: 'date',
        product: 'string',
      },
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-ds-3',
    name: 'product_analytics',
    schema: {
      dateField: 'timestamp',
      fields: {
        session_id: 'string',
        page_view: 'string',
        duration: 'number',
        device_type: 'string',
        timestamp: 'date',
      },
    },
    createdAt: new Date().toISOString(),
  },
]

const demoSources: DataSource[] = [
  {
    id: 'demo-source-1',
    name: 'Customer Events',
    type: 'WEBHOOK',
    config: { datasetId: 'demo-ds-1', fieldMapping: { event_id: 'event_id' } },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-source-2',
    name: 'Sales Transactions',
    type: 'CSV',
    config: { datasetId: 'demo-ds-2', fieldMapping: { transaction_id: 'transaction_id' } },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-source-3',
    name: 'Product Analytics',
    type: 'REST_POLL',
    config: { datasetId: 'demo-ds-3', fieldMapping: { session_id: 'session_id' } },
    createdAt: new Date().toISOString(),
  },
]

const demoRecordsMeta: Record<string, { count: number; lastUpdated: string }> = {
  'demo-ds-1': { count: 458723, lastUpdated: dayjs().subtract(2, 'hour').toISOString() },
  'demo-ds-2': { count: 12845, lastUpdated: dayjs().subtract(7, 'hour').toISOString() },
  'demo-ds-3': { count: 892451, lastUpdated: dayjs().subtract(1, 'hour').toISOString() },
}

const datasetsForView = computed(() => (datasets.value.length ? datasets.value : demoDatasets))
const sourcesForView = computed(() => (dataSources.value.length ? dataSources.value : demoSources))

const filteredDatasets = computed(() => {
  if (!query.value.trim()) return datasetsForView.value
  const needle = query.value.toLowerCase()
  return datasetsForView.value.filter((dataset) => dataset.name.toLowerCase().includes(needle))
})

const sourceMap = computed(() => {
  const map = new Map<string, DataSource>()
  sourcesForView.value.forEach((source) => {
    if (source.config?.datasetId && !map.has(source.config.datasetId)) {
      map.set(source.config.datasetId, source)
    }
  })
  return map
})

const formatTimestamp = (value?: string) => {
  if (!value) return 'No updates yet'
  return dayjs(value).format('MMM D, YYYY h:mm A')
}

const formatRecordCount = (datasetId: string) => {
  const meta = recordsMeta[datasetId]
  if (!meta) return '--'
  const base = formatNumber(meta.count)
  return meta.hasMore ? `${base}+` : base
}

const loadDatasets = async () => {
  loading.value = true
  error.value = ''
  try {
    datasets.value = await listDatasets()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load datasets.'
  }
  try {
    dataSources.value = await listDataSources()
  } catch {
    dataSources.value = []
  }
  try {
    const pageSize = 500
    if (!datasets.value.length) {
      Object.entries(demoRecordsMeta).forEach(([datasetId, meta]) => {
        recordsMeta[datasetId] = { count: meta.count, hasMore: false, lastUpdated: meta.lastUpdated }
      })
    } else {
      await Promise.all(
        datasetsForView.value.map(async (dataset) => {
          try {
            const response = await listDatasetRecords(dataset.id, { pageSize })
            recordsMeta[dataset.id] = {
              count: response.data.length,
              hasMore: response.data.length >= pageSize,
              lastUpdated: response.data[0]?.eventTime,
            }
          } catch {
            recordsMeta[dataset.id] = { count: 0, hasMore: false }
          }
        })
      )
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDatasets()
})
</script>

<template>
  <section class="mx-auto w-full max-w-5xl">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Datasets</h1>
        <p class="mt-1 text-sm text-slate-500">Browse and explore your data collections</p>
      </div>
    </div>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <div class="relative flex min-w-[240px] flex-1 items-center">
        <Search class="absolute left-3 h-4 w-4 text-slate-400" />
        <input
          v-model="query"
          type="search"
          placeholder="Search datasets..."
          class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 shadow-sm"
        />
      </div>
    </div>

    <p v-if="error" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
      {{ error }} Using demo data for layout.
    </p>

    <div v-if="loading" class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="index in 3" :key="index" class="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
    </div>

    <div v-else class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="dataset in filteredDatasets"
        :key="dataset.id"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-600">
              <Table2 class="h-5 w-5" />
            </div>
            <div>
              <span class="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {{ dataset.name }}
              </span>
            </div>
          </div>
          <span class="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            {{ Object.keys(dataset.schema?.fields ?? {}).length }} fields
          </span>
        </div>

        <p class="mt-4 text-xs text-slate-500">
          Source: {{ sourceMap.get(dataset.id)?.name ?? 'Unlinked source' }}
        </p>

        <div class="mt-4 grid gap-2 text-xs text-slate-500">
          <div class="flex items-center justify-between">
            <span>Records</span>
            <span class="font-semibold text-slate-900">{{ formatRecordCount(dataset.id) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>Last updated</span>
            <span class="text-slate-700">{{ formatTimestamp(recordsMeta[dataset.id]?.lastUpdated) }}</span>
          </div>
        </div>

        <div class="mt-4 border-t border-dashed border-slate-200 pt-3">
          <p class="text-xs text-slate-400">Schema</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="field in Object.keys(dataset.schema?.fields ?? {}).slice(0, 4)"
              :key="field"
              class="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
            >
              {{ field }}
            </span>
            <span
              v-if="Object.keys(dataset.schema?.fields ?? {}).length > 4"
              class="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
            >
              +{{ Object.keys(dataset.schema?.fields ?? {}).length - 4 }} more
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
