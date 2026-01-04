<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { Plus, Search, X } from 'lucide-vue-next'
import { listAutomations, listAutomationRuns, createAutomation } from '../../../services/automations.api'
import { listMetrics } from '../../../services/metrics.api'
import type { AutomationRule, AutomationRun } from '../../../types/automation'
import type { Metric } from '../../../types/metric'

const rules = ref<AutomationRule[]>([])
const runs = ref<AutomationRun[]>([])
const metrics = ref<Metric[]>([])
const loading = ref(false)
const error = ref('')
const query = ref('')

const modalOpen = ref(false)
const isSubmitting = ref(false)
const formError = ref('')

const form = reactive({
  name: '',
  metricId: '',
  operator: 'gt' as AutomationRule['condition']['operator'],
  threshold: 1000,
  range: 'last7',
  actionType: 'IN_APP' as AutomationRule['action']['type'],
  target: '',
  title: '',
  message: '',
})

const demoMetrics: Metric[] = [
  {
    id: 'demo-m1',
    name: 'Total Revenue',
    datasetId: 'demo-ds',
    definition: { aggregation: 'sum', field: 'amount' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-m2',
    name: 'Active Users',
    datasetId: 'demo-ds',
    definition: { aggregation: 'count' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-m3',
    name: 'Failed Transactions',
    datasetId: 'demo-ds',
    definition: { aggregation: 'count' },
    createdAt: new Date().toISOString(),
  },
]

const demoRules: AutomationRule[] = [
  {
    id: 'demo-rule-1',
    name: 'High Revenue Alert',
    metricId: 'demo-m1',
    condition: { operator: 'gt', threshold: 50000, range: 'last7' },
    action: { type: 'IN_APP', title: 'Revenue Alert', message: 'Daily revenue exceeded $50k.' },
    status: 'ENABLED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-rule-2',
    name: 'Low Engagement Warning',
    metricId: 'demo-m2',
    condition: { operator: 'lt', threshold: 40000, range: 'last30' },
    action: { type: 'EMAIL', title: 'Engagement Dip', message: 'Active users dropped below 40k.' },
    status: 'ENABLED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-rule-3',
    name: 'Failed Transaction Monitor',
    metricId: 'demo-m3',
    condition: { operator: 'gt', threshold: 100 },
    action: { type: 'WEBHOOK', target: 'https://example.com/webhook' },
    status: 'DISABLED',
    createdAt: new Date().toISOString(),
  },
]

const demoRuns: AutomationRun[] = [
  {
    id: 'demo-run-1',
    ruleId: 'demo-rule-1',
    status: 'SUCCESS',
    windowStart: dayjs().subtract(1, 'day').toISOString(),
    windowEnd: dayjs().subtract(1, 'day').add(1, 'hour').toISOString(),
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
  },
  {
    id: 'demo-run-2',
    ruleId: 'demo-rule-2',
    status: 'SUCCESS',
    windowStart: dayjs().subtract(4, 'day').toISOString(),
    windowEnd: dayjs().subtract(4, 'day').add(1, 'hour').toISOString(),
    createdAt: dayjs().subtract(3, 'day').toISOString(),
  },
]

const rulesForView = computed(() => (rules.value.length ? rules.value : demoRules))
const metricsForView = computed(() => (metrics.value.length ? metrics.value : demoMetrics))
const runsForView = computed(() => (runs.value.length ? runs.value : demoRuns))

const metricMap = computed(() => new Map(metricsForView.value.map((metric) => [metric.id, metric])))

const filteredRules = computed(() => {
  if (!query.value.trim()) return rulesForView.value
  const needle = query.value.toLowerCase()
  return rulesForView.value.filter((rule) => rule.name.toLowerCase().includes(needle))
})

const lastRunByRule = computed(() => {
  const map = new Map<string, AutomationRun>()
  runsForView.value.forEach((run) => {
    if (!map.has(run.ruleId)) {
      map.set(run.ruleId, run)
      return
    }
    const existing = map.get(run.ruleId)
    if (existing && dayjs(run.createdAt).isAfter(existing.createdAt)) {
      map.set(run.ruleId, run)
    }
  })
  return map
})

const operatorLabel = (operator: AutomationRule['condition']['operator']) => {
  const map: Record<AutomationRule['condition']['operator'], string> = {
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    eq: '=',
    neq: '!=',
  }
  return map[operator]
}

const rangeLabel = (range?: string) => {
  if (!range) return ''
  if (range === 'today') return 'Today'
  if (range === 'last7') return 'Last 7 Days'
  if (range === 'last30') return 'Last 30 Days'
  return 'Custom'
}

const actionTags = (rule: AutomationRule) => {
  if (rule.action.type === 'IN_APP') return ['notification']
  if (rule.action.type === 'EMAIL') return ['email']
  return ['webhook']
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
  form.metricId = metricsForView.value[0]?.id ?? ''
  form.operator = 'gt'
  form.threshold = 1000
  form.range = 'last7'
  form.actionType = 'IN_APP'
  form.target = ''
  form.title = ''
  form.message = ''
  formError.value = ''
}

const openModal = () => {
  resetForm()
  modalOpen.value = true
}

const handleCreate = async () => {
  formError.value = ''
  if (!form.name.trim()) {
    formError.value = 'Automation name is required.'
    return
  }
  if (!form.metricId) {
    formError.value = 'Metric is required.'
    return
  }
  if (form.actionType === 'WEBHOOK' && !form.target.trim()) {
    formError.value = 'Webhook target URL is required.'
    return
  }

  isSubmitting.value = true
  try {
    const created = await createAutomation({
      name: form.name.trim(),
      metricId: form.metricId,
      condition: {
        operator: form.operator,
        threshold: Number(form.threshold),
        range: form.range,
      },
      action: {
        type: form.actionType,
        target: form.actionType === 'WEBHOOK' ? form.target.trim() : undefined,
        title: form.title.trim() || undefined,
        message: form.message.trim() || undefined,
      },
    })
    rules.value = [created, ...rules.value]
    modalOpen.value = false
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Unable to create automation.'
  } finally {
    isSubmitting.value = false
  }
}

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    rules.value = await listAutomations()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load automations.'
  }
  try {
    metrics.value = await listMetrics()
  } catch {
    metrics.value = []
  }
  try {
    const response = await listAutomationRuns({ pageSize: 200 })
    runs.value = response.data
  } catch {
    runs.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

watch(
  () => metricsForView.value,
  () => {
    if (!form.metricId && metricsForView.value.length) {
      form.metricId = metricsForView.value[0].id
    }
  }
)
</script>

<template>
  <section class="mx-auto w-full max-w-5xl">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Automations</h1>
        <p class="mt-1 text-sm text-slate-500">Create rules and workflows triggered by metric conditions</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
        @click="openModal"
      >
        <Plus class="h-4 w-4" />
        Create Automation
      </button>
    </div>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <div class="relative flex min-w-[240px] flex-1 items-center">
        <Search class="absolute left-3 h-4 w-4 text-slate-400" />
        <input
          v-model="query"
          type="search"
          placeholder="Search automations..."
          class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 shadow-sm"
        />
      </div>
    </div>

    <p v-if="error" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
      {{ error }} Using demo data for layout.
    </p>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="index in 3" :key="index" class="h-16 animate-pulse rounded-2xl bg-white shadow-sm" />
    </div>

    <div v-else class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_0.6fr] gap-4 border-b border-slate-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        <span>Name</span>
        <span>Metric</span>
        <span>Condition</span>
        <span>Actions</span>
        <span>Last Triggered</span>
        <span>Status</span>
      </div>
      <div v-if="filteredRules.length === 0" class="px-5 py-6 text-sm text-slate-500">
        No automation rules yet.
      </div>
      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="rule in filteredRules"
          :key="rule.id"
          class="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_0.6fr] gap-4 px-5 py-4 text-sm text-slate-700"
        >
          <div>
            <p class="font-semibold text-slate-900">{{ rule.name }}</p>
            <p class="text-xs text-slate-500">Track {{ metricMap.get(rule.metricId)?.name ?? 'metric' }}</p>
          </div>
          <div class="text-xs font-semibold text-slate-700">
            {{ metricMap.get(rule.metricId)?.name ?? 'Unknown' }}
          </div>
          <div class="text-xs text-slate-600">
            {{ operatorLabel(rule.condition.operator) }} {{ rule.condition.threshold }}
            <span v-if="rule.condition.range" class="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {{ rangeLabel(rule.condition.range) }}
            </span>
          </div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="tag in actionTags(rule)"
              :key="tag"
              class="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600"
            >
              {{ tag }}
            </span>
          </div>
          <div class="text-xs text-slate-500">
            {{ lastRunByRule.get(rule.id) ? formatRelative(lastRunByRule.get(rule.id)!.createdAt) : 'Never' }}
          </div>
          <div>
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              :class="rule.status === 'ENABLED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-700'"
            >
              {{ rule.status === 'ENABLED' ? 'Enabled' : 'Paused' }}
            </span>
          </div>
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
                      Create Automation
                    </DialogTitle>
                    <p class="mt-1 text-sm text-slate-500">
                      Trigger alerts based on metric thresholds.
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
                    <label class="text-xs font-semibold text-slate-600">Automation name</label>
                    <input
                      v-model="form.name"
                      type="text"
                      placeholder="High Revenue Alert"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    />
                  </div>
                  <div class="grid gap-2">
                    <label class="text-xs font-semibold text-slate-600">Metric</label>
                    <select
                      v-model="form.metricId"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <option value="" disabled>Select metric</option>
                      <option v-for="metric in metricsForView" :key="metric.id" :value="metric.id">
                        {{ metric.name }}
                      </option>
                    </select>
                  </div>
                  <div class="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[120px_1fr_1fr]">
                    <div class="grid gap-2">
                      <label class="text-xs font-semibold text-slate-600">Operator</label>
                      <select
                        v-model="form.operator"
                        class="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700"
                      >
                        <option value="gt">Greater than</option>
                        <option value="gte">Greater or equal</option>
                        <option value="lt">Less than</option>
                        <option value="lte">Less or equal</option>
                        <option value="eq">Equal</option>
                        <option value="neq">Not equal</option>
                      </select>
                    </div>
                    <div class="grid gap-2">
                      <label class="text-xs font-semibold text-slate-600">Threshold</label>
                      <input
                        v-model.number="form.threshold"
                        type="number"
                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      />
                    </div>
                    <div class="grid gap-2">
                      <label class="text-xs font-semibold text-slate-600">Range</label>
                      <select
                        v-model="form.range"
                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        <option value="today">Today</option>
                        <option value="last7">Last 7 Days</option>
                        <option value="last30">Last 30 Days</option>
                      </select>
                    </div>
                  </div>
                  <div class="grid gap-2">
                    <label class="text-xs font-semibold text-slate-600">Action type</label>
                    <select
                      v-model="form.actionType"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <option value="IN_APP">In-app notification</option>
                      <option value="EMAIL">Email</option>
                      <option value="WEBHOOK">Webhook</option>
                    </select>
                  </div>
                  <div v-if="form.actionType === 'WEBHOOK'" class="grid gap-2">
                    <label class="text-xs font-semibold text-slate-600">Webhook target</label>
                    <input
                      v-model="form.target"
                      type="url"
                      placeholder="https://hooks.example.com"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    />
                  </div>
                  <div class="grid gap-2">
                    <label class="text-xs font-semibold text-slate-600">Title</label>
                    <input
                      v-model="form.title"
                      type="text"
                      placeholder="Revenue alert"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    />
                  </div>
                  <div class="grid gap-2">
                    <label class="text-xs font-semibold text-slate-600">Message</label>
                    <textarea
                      v-model="form.message"
                      rows="3"
                      placeholder="Revenue exceeded the daily target."
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    ></textarea>
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
                    {{ isSubmitting ? 'Creating...' : 'Create Automation' }}
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
