<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { Plus, Search, X } from 'lucide-vue-next'
import { listMetrics, createMetric } from '../../../services/metrics.api'
import { listDatasets } from '../../../services/datasets.api'
import type { Metric, MetricAggregation, MetricFilter } from '../../../types/metric'
import type { Dataset } from '../../../types/dataset'
import { formatShortDate } from '../../../utils/dates'

const metrics = ref<Metric[]>([])
const datasets = ref<Dataset[]>([])
const loading = ref(false)
const error = ref('')
const query = ref('')

const modalOpen = ref(false)
const isSubmitting = ref(false)
const formError = ref('')

const form = reactive({
  name: '',
  datasetId: '',
  mode: 'aggregation' as 'aggregation' | 'expression',
  aggregation: 'sum' as MetricAggregation,
  field: '',
  expression: '',
  filters: [] as Array<{ field: string; op: MetricFilter['op']; value: string }>,
})

const filterOps: Array<{ value: MetricFilter['op']; label: string }> = [
  { value: 'eq', label: 'Equals' },
  { value: 'neq', label: 'Not equal' },
  { value: 'gt', label: 'Greater than' },
  { value: 'gte', label: 'Greater or equal' },
  { value: 'lt', label: 'Less than' },
  { value: 'lte', label: 'Less or equal' },
]

const filteredMetrics = computed(() => {
  if (!query.value.trim()) return metrics.value
  const needle = query.value.toLowerCase()
  return metrics.value.filter((metric) => metric.name.toLowerCase().includes(needle))
})

const datasetMap = computed(() => {
  return new Map(datasets.value.map((dataset) => [dataset.id, dataset]))
})

const selectedDataset = computed(() => datasetMap.value.get(form.datasetId))

const datasetFields = computed(() => {
  const fields = selectedDataset.value?.schema?.fields ?? {}
  return Object.keys(fields)
})

const loadMetrics = async () => {
  loading.value = true
  error.value = ''
  try {
    metrics.value = await listMetrics()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load metrics.'
  } finally {
    loading.value = false
  }
}

const loadDatasets = async () => {
  try {
    datasets.value = await listDatasets()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load datasets.'
  }
}

const resetForm = () => {
  form.name = ''
  form.datasetId = datasets.value[0]?.id ?? ''
  form.mode = 'aggregation'
  form.aggregation = 'sum'
  form.field = ''
  form.expression = ''
  form.filters = []
  formError.value = ''
}

const openModal = () => {
  resetForm()
  modalOpen.value = true
}

const addFilter = () => {
  form.filters.push({ field: '', op: 'eq', value: '' })
}

const removeFilter = (index: number) => {
  form.filters.splice(index, 1)
}

const parseFilterValue = (raw: string) => {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed === 'true' || trimmed === 'false') {
    return trimmed === 'true'
  }
  const numeric = Number(trimmed)
  if (!Number.isNaN(numeric)) {
    return numeric
  }
  return trimmed
}

const buildFilters = () => {
  return form.filters
    .filter((filter) => filter.field && filter.value.trim())
    .map((filter) => ({
      field: filter.field,
      op: filter.op,
      value: parseFilterValue(filter.value),
    }))
}

const handleCreate = async () => {
  formError.value = ''
  if (!form.name.trim()) {
    formError.value = 'Metric name is required.'
    return
  }
  if (!form.datasetId) {
    formError.value = 'Dataset is required.'
    return
  }
  if (form.mode === 'expression' && !form.expression.trim()) {
    formError.value = 'Expression is required.'
    return
  }
  if (form.mode === 'aggregation' && form.aggregation !== 'count' && !form.field) {
    formError.value = 'Select a field for the aggregation.'
    return
  }

  const definition =
    form.mode === 'expression'
      ? {
          expression: form.expression.trim(),
          filters: buildFilters(),
        }
      : {
          aggregation: form.aggregation,
          field: form.aggregation === 'count' ? form.field || undefined : form.field,
          filters: buildFilters(),
        }

  isSubmitting.value = true
  try {
    const created = await createMetric({
      name: form.name.trim(),
      datasetId: form.datasetId,
      definition,
    })
    metrics.value = [created, ...metrics.value]
    modalOpen.value = false
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Unable to create metric.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadMetrics()
  loadDatasets()
})

watch(
  () => datasets.value,
  () => {
    if (!form.datasetId && datasets.value.length) {
      form.datasetId = datasets.value[0].id
    }
  }
)

watch(
  () => form.datasetId,
  () => {
    if (form.field && !datasetFields.value.includes(form.field)) {
      form.field = ''
    }
  }
)
</script>

<template>
  <section class="mx-auto w-full max-w-5xl">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Metrics</h1>
        <p class="mt-1 text-sm text-slate-500">
          Define calculations using aggregations or formulas.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
        @click="openModal"
      >
        <Plus class="h-4 w-4" />
        Create Metric
      </button>
    </div>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <div class="relative flex min-w-[240px] flex-1 items-center">
        <Search class="absolute left-3 h-4 w-4 text-slate-400" />
        <input
          v-model="query"
          type="search"
          placeholder="Search metrics..."
          class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 shadow-sm"
        />
      </div>
    </div>

    <p v-if="error" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
      {{ error }}
    </p>

    <div v-if="loading" class="mt-6 grid gap-4 md:grid-cols-2">
      <div v-for="index in 4" :key="index" class="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
    </div>

    <div v-else class="mt-6">
      <div v-if="filteredMetrics.length === 0" class="rounded-2xl border border-slate-200 bg-white p-6">
        <p class="text-sm text-slate-500">No metrics found.</p>
      </div>
      <div v-else class="grid gap-4 md:grid-cols-2">
        <div v-for="metric in filteredMetrics" :key="metric.id" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-slate-900">{{ metric.name }}</h3>
              <p class="mt-1 text-xs text-slate-500">
                Dataset: {{ datasetMap.get(metric.datasetId)?.name ?? 'Unknown' }}
              </p>
            </div>
            <span class="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {{ metric.definition.expression ? 'Formula' : metric.definition.aggregation?.toUpperCase() }}
            </span>
          </div>
          <p class="mt-3 text-sm text-slate-700">
            <span v-if="metric.definition.expression">{{ metric.definition.expression }}</span>
            <span v-else>
              {{ metric.definition.aggregation?.toUpperCase() }}
              <span v-if="metric.definition.field">({{ metric.definition.field }})</span>
            </span>
          </p>
          <p v-if="metric.definition.filters?.length" class="mt-2 text-xs text-slate-500">
            {{ metric.definition.filters.length }} filters applied
          </p>
          <p class="mt-3 text-xs text-slate-400">Created {{ formatShortDate(metric.createdAt) }}</p>
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
              <DialogPanel class="w-full max-w-xl overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl">
                <div class="flex items-start justify-between">
                  <div>
                    <DialogTitle class="text-lg font-semibold text-slate-900">
                      Create Metric
                    </DialogTitle>
                    <p class="mt-1 text-sm text-slate-500">
                      Build aggregations or formulas from your dataset fields.
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
                    <label class="text-xs font-semibold text-slate-600">Metric name</label>
                    <input
                      v-model="form.name"
                      type="text"
                      placeholder="Total Revenue"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    />
                  </div>

                  <div class="grid gap-2">
                    <label class="text-xs font-semibold text-slate-600">Dataset</label>
                    <select
                      v-model="form.datasetId"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <option value="" disabled>Select dataset</option>
                      <option v-for="dataset in datasets" :key="dataset.id" :value="dataset.id">
                        {{ dataset.name }}
                      </option>
                    </select>
                  </div>

                  <div class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                    <button
                      type="button"
                      class="flex-1 rounded-xl px-3 py-2 text-xs font-semibold"
                      :class="form.mode === 'aggregation' ? 'bg-slate-900 text-white' : 'text-slate-600'"
                      @click="form.mode = 'aggregation'"
                    >
                      Aggregation
                    </button>
                    <button
                      type="button"
                      class="flex-1 rounded-xl px-3 py-2 text-xs font-semibold"
                      :class="form.mode === 'expression' ? 'bg-slate-900 text-white' : 'text-slate-600'"
                      @click="form.mode = 'expression'"
                    >
                      Formula
                    </button>
                  </div>

                  <div v-if="form.mode === 'aggregation'" class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <div class="grid gap-2">
                      <label class="text-xs font-semibold text-slate-600">Aggregation</label>
                      <select
                        v-model="form.aggregation"
                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        <option value="sum">Sum</option>
                        <option value="avg">Average</option>
                        <option value="count">Count</option>
                      </select>
                    </div>
                    <div class="grid gap-2">
                      <label class="text-xs font-semibold text-slate-600">
                        Field <span class="text-slate-400">(optional for count)</span>
                      </label>
                      <select
                        v-model="form.field"
                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        <option value="">Select field</option>
                        <option v-for="field in datasetFields" :key="field" :value="field">
                          {{ field }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div v-else class="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4">
                    <label class="text-xs font-semibold text-slate-600">Formula</label>
                    <textarea
                      v-model="form.expression"
                      rows="3"
                      placeholder="sum(amount) / count(amount)"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    ></textarea>
                    <p class="text-xs text-slate-400">
                      Use sum(), avg(), count() with + - * / operators.
                    </p>
                  </div>

                  <div class="rounded-2xl border border-slate-200 bg-white p-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-semibold text-slate-900">Filters</p>
                        <p class="text-xs text-slate-500">Optional filters to narrow records.</p>
                      </div>
                      <button
                        type="button"
                        class="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                        @click="addFilter"
                      >
                        Add filter
                      </button>
                    </div>
                    <div v-if="form.filters.length" class="mt-3 space-y-2">
                      <div
                        v-for="(filter, index) in form.filters"
                        :key="`filter-${index}`"
                        class="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                      >
                        <select
                          v-model="filter.field"
                          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                        >
                          <option value="">Field</option>
                          <option v-for="field in datasetFields" :key="field" :value="field">
                            {{ field }}
                          </option>
                        </select>
                        <select
                          v-model="filter.op"
                          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                        >
                          <option v-for="op in filterOps" :key="op.value" :value="op.value">
                            {{ op.label }}
                          </option>
                        </select>
                        <input
                          v-model="filter.value"
                          type="text"
                          placeholder="Value"
                          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                        />
                        <button
                          type="button"
                          class="rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-500"
                          @click="removeFilter(index)"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p v-else class="mt-3 text-xs text-slate-400">No filters added yet.</p>
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
                    {{ isSubmitting ? 'Creating...' : 'Create Metric' }}
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
