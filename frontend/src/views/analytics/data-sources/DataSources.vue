<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { Cloud, Database, FileText, MoreVertical, Plug, Plus, Search, X } from 'lucide-vue-next'
import { listDataSources, createDataSource } from '../../../services/dataSources.api'
import { listDatasets } from '../../../services/datasets.api'
import { listIngestionLogs } from '../../../services/ingestion.api'
import type { DataSource, DataSourceType } from '../../../types/dataSource'
import type { Dataset } from '../../../types/dataset'
import type { IngestionLog } from '../../../types/ingestion'
import { formatNumber } from '../../../utils/formatters'

const dataSources = ref<DataSource[]>([])
const datasets = ref<Dataset[]>([])
const ingestionLogs = ref<IngestionLog[]>([])
const loading = ref(false)
const error = ref('')
const query = ref('')

const modalOpen = ref(false)
const isSubmitting = ref(false)
const formError = ref('')

const form = reactive({
  name: '',
  type: 'CSV' as DataSourceType,
  datasetId: '',
  restEndpoint: '',
  webhookSecret: '',
})

const demoDatasets: Dataset[] = [
  {
    id: 'demo-ds-1',
    name: 'Customer Events',
    schema: {
      dateField: 'timestamp',
      fields: { event_id: 'string', user_id: 'string', event_type: 'string', timestamp: 'date' },
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-ds-2',
    name: 'Sales Transactions',
    schema: {
      dateField: 'timestamp',
      fields: { transaction_id: 'string', customer_id: 'string', amount: 'number', timestamp: 'date' },
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-ds-3',
    name: 'Product Analytics',
    schema: {
      dateField: 'timestamp',
      fields: { session_id: 'string', page_view: 'string', duration: 'number', timestamp: 'date' },
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
  {
    id: 'demo-source-4',
    name: 'User Feedback',
    type: 'WEBHOOK',
    config: { datasetId: 'demo-ds-1', fieldMapping: { event_id: 'event_id' } },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-source-5',
    name: 'Marketing Campaigns',
    type: 'CSV',
    config: { datasetId: 'demo-ds-2', fieldMapping: { transaction_id: 'transaction_id' } },
    createdAt: new Date().toISOString(),
  },
]

const demoLogs: IngestionLog[] = [
  {
    id: 'demo-log-1',
    dataSourceId: 'demo-source-1',
    status: 'SUCCESS',
    message: 'Ingestion complete',
    rawPayload: { ingested: 458723 },
    createdAt: dayjs().subtract(16, 'minute').toISOString(),
  },
  {
    id: 'demo-log-2',
    dataSourceId: 'demo-source-2',
    status: 'SUCCESS',
    message: 'CSV import complete',
    rawPayload: { ingested: 12845 },
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
  },
  {
    id: 'demo-log-3',
    dataSourceId: 'demo-source-3',
    status: 'SUCCESS',
    message: 'REST poll complete',
    rawPayload: { ingested: 892451 },
    createdAt: dayjs().subtract(31, 'minute').toISOString(),
  },
  {
    id: 'demo-log-4',
    dataSourceId: 'demo-source-4',
    status: 'FAILED',
    message: 'Webhook error',
    rawPayload: { ingested: 0 },
    createdAt: dayjs().subtract(1, 'day').toISOString(),
  },
  {
    id: 'demo-log-5',
    dataSourceId: 'demo-source-5',
    status: 'SUCCESS',
    message: 'CSV import complete',
    rawPayload: { ingested: 8932 },
    createdAt: dayjs().subtract(4, 'hour').toISOString(),
  },
]

const sourcesForView = computed(() => (dataSources.value.length ? dataSources.value : demoSources))
const datasetsForView = computed(() => (datasets.value.length ? datasets.value : demoDatasets))
const logsForView = computed(() => (ingestionLogs.value.length ? ingestionLogs.value : demoLogs))

const datasetMap = computed(() => new Map(datasetsForView.value.map((dataset) => [dataset.id, dataset])))

const filteredSources = computed(() => {
  if (!query.value.trim()) return sourcesForView.value
  const needle = query.value.toLowerCase()
  return sourcesForView.value.filter((source) => source.name.toLowerCase().includes(needle))
})

const logBySource = computed(() => {
  const map = new Map<string, IngestionLog>()
  logsForView.value.forEach((log) => {
    if (!map.has(log.dataSourceId)) {
      map.set(log.dataSourceId, log)
      return
    }
    const current = map.get(log.dataSourceId)
    if (current && dayjs(log.createdAt).isAfter(current.createdAt)) {
      map.set(log.dataSourceId, log)
    }
  })
  return map
})

const ingestionTotalsBySource = computed(() => {
  const totals = new Map<string, number>()
  logsForView.value.forEach((log) => {
    const rawPayload = log.rawPayload as { ingested?: number } | null | undefined
    const ingested = Number(rawPayload?.ingested ?? 0)
    totals.set(log.dataSourceId, (totals.get(log.dataSourceId) ?? 0) + (Number.isFinite(ingested) ? ingested : 0))
  })
  return totals
})

const totalRecords = computed(() => {
  let total = 0
  ingestionTotalsBySource.value.forEach((count) => {
    total += count
  })
  return total
})

const activeSourcesCount = computed(() => {
  let active = 0
  sourcesForView.value.forEach((source) => {
    const log = logBySource.value.get(source.id)
    if (!log || log.status === 'SUCCESS') {
      active += 1
    }
  })
  return active
})

const failedSourcesCount = computed(() => {
  let failed = 0
  sourcesForView.value.forEach((source) => {
    const log = logBySource.value.get(source.id)
    if (log?.status === 'FAILED') {
      failed += 1
    }
  })
  return failed
})

const typeMeta: Record<DataSourceType, { label: string; icon: typeof Plug; color: string; bg: string }> = {
  CSV: { label: 'CSV', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  WEBHOOK: { label: 'Webhook', icon: Plug, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  REST_POLL: { label: 'REST API', icon: Cloud, color: 'text-sky-600', bg: 'bg-sky-50' },
}

const formatRelative = (value: string) => {
  const now = dayjs()
  const date = dayjs(value)
  const minutes = now.diff(date, 'minute')
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = now.diff(date, 'hour')
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = now.diff(date, 'day')
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const resetForm = () => {
  form.name = ''
  form.type = 'CSV'
  form.datasetId = datasetsForView.value[0]?.id ?? ''
  form.restEndpoint = ''
  form.webhookSecret = ''
  formError.value = ''
}

const openModal = () => {
  resetForm()
  modalOpen.value = true
}

const buildFieldMapping = (dataset?: Dataset) => {
  const fields = dataset?.schema?.fields ?? {}
  const mapping: Record<string, string> = {}
  Object.keys(fields).forEach((field) => {
    mapping[field] = field
  })
  return mapping
}

const handleCreate = async () => {
  formError.value = ''
  if (!form.name.trim()) {
    formError.value = 'Name is required.'
    return
  }
  if (!form.datasetId) {
    formError.value = 'Dataset is required.'
    return
  }
  if (form.type === 'REST_POLL' && !form.restEndpoint.trim()) {
    formError.value = 'REST endpoint is required.'
    return
  }
  if (form.type === 'WEBHOOK' && form.webhookSecret && form.webhookSecret.length < 8) {
    formError.value = 'Webhook secret must be at least 8 characters.'
    return
  }

  const dataset = datasetMap.value.get(form.datasetId)
  isSubmitting.value = true
  try {
    const created = await createDataSource({
      name: form.name.trim(),
      type: form.type,
      config: {
        datasetId: form.datasetId,
        fieldMapping: buildFieldMapping(dataset),
        dateField: dataset?.schema?.dateField,
        restEndpoint: form.type === 'REST_POLL' ? form.restEndpoint.trim() : undefined,
        webhookSecret: form.type === 'WEBHOOK' ? form.webhookSecret.trim() || undefined : undefined,
      },
    })
    dataSources.value = [created, ...dataSources.value]
    modalOpen.value = false
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Unable to create data source.'
  } finally {
    isSubmitting.value = false
  }
}

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    dataSources.value = await listDataSources()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load data sources.'
  }
  try {
    datasets.value = await listDatasets()
  } catch (err) {
    error.value = error.value || (err instanceof Error ? err.message : 'Unable to load datasets.')
  }
  try {
    const response = await listIngestionLogs({ pageSize: 200 })
    ingestionLogs.value = response.data
  } catch {
    ingestionLogs.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

watch(
  () => datasetsForView.value,
  () => {
    if (!form.datasetId && datasetsForView.value.length) {
      form.datasetId = datasetsForView.value[0].id
    }
  }
)
</script>

<template>
  <section class="mx-auto w-full max-w-5xl">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Data Sources</h1>
        <p class="mt-1 text-sm text-slate-500">Connect and manage your data ingestion sources</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
        @click="openModal"
      >
        <Plus class="h-4 w-4" />
        Add Data Source
      </button>
    </div>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <div class="relative flex min-w-[240px] flex-1 items-center">
        <Search class="absolute left-3 h-4 w-4 text-slate-400" />
        <input
          v-model="query"
          type="search"
          placeholder="Search data sources..."
          class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 shadow-sm"
        />
      </div>
    </div>

    <p v-if="error" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
      {{ error }} Using demo data for layout.
    </p>

    <div v-if="loading" class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="index in 5" :key="index" class="h-52 animate-pulse rounded-2xl bg-white shadow-sm" />
    </div>

    <div v-else class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="source in filteredSources"
        :key="source.id"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div
              class="grid h-10 w-10 place-items-center rounded-xl"
              :class="typeMeta[source.type].bg"
            >
              <component :is="typeMeta[source.type].icon" class="h-5 w-5" :class="typeMeta[source.type].color" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-900">{{ source.name }}</h3>
              <p class="mt-1 text-xs text-slate-500">{{ typeMeta[source.type].label }}</p>
            </div>
          </div>
          <button class="rounded-full border border-slate-200 bg-white p-1 text-slate-400">
            <MoreVertical class="h-4 w-4" />
          </button>
        </div>

        <div class="mt-4 grid gap-2 text-xs text-slate-500">
          <div class="flex items-center justify-between">
            <span>Status</span>
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              :class="logBySource.get(source.id)?.status === 'FAILED'
                ? 'bg-rose-100 text-rose-600'
                : 'bg-emerald-100 text-emerald-600'"
            >
              {{ logBySource.get(source.id)?.status === 'FAILED' ? 'Error' : 'Connected' }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span>Records</span>
            <span class="font-semibold text-slate-900">
              {{ formatNumber(ingestionTotalsBySource.get(source.id) ?? 0) }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span>Last sync</span>
            <span class="text-slate-700">
              {{ logBySource.get(source.id) ? formatRelative(logBySource.get(source.id)!.createdAt) : 'No sync yet' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Database class="h-4 w-4 text-slate-500" />
        Ingestion Overview
      </div>
      <div class="mt-4 grid gap-4 md:grid-cols-3">
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">Total Records</p>
          <p class="mt-2 text-lg font-semibold text-slate-900">{{ formatNumber(totalRecords) }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">Active Sources</p>
          <p class="mt-2 text-lg font-semibold text-slate-900">{{ activeSourcesCount }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs text-slate-500">Failed Sources</p>
          <p class="mt-2 text-lg font-semibold text-rose-600">{{ failedSourcesCount }}</p>
        </div>
      </div>
    </div>

    <TransitionRoot :show="modalOpen" as="template">
      <Dialog class="relative z-50" @close="modalOpen = false">
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
              <DialogPanel class="w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl">
                <div class="flex items-start justify-between">
                  <div>
                    <DialogTitle class="text-lg font-semibold text-slate-900">
                      Add Data Source
                    </DialogTitle>
                    <p class="mt-1 text-sm text-slate-500">
                      Connect a new ingestion source to your datasets.
                    </p>
                  </div>
                  <button
                    type="button"
                    class="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                    @click="modalOpen = false"
                  >
                    <X class="h-4 w-4" />
                  </button>
                </div>

                <div class="mt-4 grid gap-4">
                  <div class="grid gap-2">
                    <label class="text-xs font-semibold text-slate-600">Name</label>
                    <input
                      v-model="form.name"
                      type="text"
                      placeholder="Marketing Campaigns"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    />
                  </div>
                  <div class="grid gap-2">
                    <label class="text-xs font-semibold text-slate-600">Source type</label>
                    <select
                      v-model="form.type"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <option value="WEBHOOK">Webhook</option>
                      <option value="CSV">CSV</option>
                      <option value="REST_POLL">REST API</option>
                    </select>
                  </div>
                  <div class="grid gap-2">
                    <label class="text-xs font-semibold text-slate-600">Dataset</label>
                    <select
                      v-model="form.datasetId"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <option value="" disabled>Select dataset</option>
                      <option v-for="dataset in datasetsForView" :key="dataset.id" :value="dataset.id">
                        {{ dataset.name }}
                      </option>
                    </select>
                  </div>
                  <div v-if="form.type === 'REST_POLL'" class="grid gap-2">
                    <label class="text-xs font-semibold text-slate-600">REST endpoint</label>
                    <input
                      v-model="form.restEndpoint"
                      type="url"
                      placeholder="https://api.example.com/events"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    />
                  </div>
                  <div v-if="form.type === 'WEBHOOK'" class="grid gap-2">
                    <label class="text-xs font-semibold text-slate-600">Webhook secret</label>
                    <input
                      v-model="form.webhookSecret"
                      type="text"
                      placeholder="optional"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    />
                  </div>
                  <p v-if="formError" class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    {{ formError }}
                  </p>
                </div>

                <div class="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
                    @click="modalOpen = false"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
                    :disabled="isSubmitting"
                    @click="handleCreate"
                  >
                    {{ isSubmitting ? 'Creating...' : 'Add Source' }}
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
