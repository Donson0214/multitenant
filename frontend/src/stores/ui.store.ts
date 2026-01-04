import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'

type ViewMode = 'grid' | 'list'
type DateRangeKey = 'today' | 'last7' | 'last30' | 'custom'

const STORAGE_KEY = 'analytics-ui'

const loadPersisted = () => {
  if (typeof window === 'undefined') {
    return {}
  }
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export const useUiStore = defineStore('ui', () => {
  const persisted = loadPersisted() as Partial<{
    sidebarCollapsed: boolean
    viewMode: ViewMode
    dateRange: DateRangeKey
    customStart: string
    customEnd: string
  }>

  const sidebarCollapsed = ref(persisted.sidebarCollapsed ?? false)
  const viewMode = ref<ViewMode>(persisted.viewMode ?? 'grid')
  const dateRange = ref<DateRangeKey>(persisted.dateRange ?? 'last7')
  const customStart = ref(persisted.customStart ?? '')
  const customEnd = ref(persisted.customEnd ?? '')

  const dateRangeLabel = computed(() => {
    if (dateRange.value === 'today') return 'Today'
    if (dateRange.value === 'last7') return 'Last 7 Days'
    if (dateRange.value === 'last30') return 'Last 30 Days'
    if (dateRange.value === 'custom' && customStart.value && customEnd.value) {
      const start = dayjs(customStart.value).format('MMM D')
      const end = dayjs(customEnd.value).format('MMM D')
      return `${start} - ${end}`
    }
    return 'Custom Range'
  })

  const persist = () => {
    if (typeof window === 'undefined') {
      return
    }
    const payload = {
      sidebarCollapsed: sidebarCollapsed.value,
      viewMode: viewMode.value,
      dateRange: dateRange.value,
      customStart: customStart.value,
      customEnd: customEnd.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  watch([sidebarCollapsed, viewMode, dateRange, customStart, customEnd], persist, {
    deep: true,
  })

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode
  }

  const setDateRange = (range: DateRangeKey) => {
    dateRange.value = range
  }

  const setCustomRange = (start: string, end: string) => {
    customStart.value = start
    customEnd.value = end
    dateRange.value = 'custom'
  }

  return {
    sidebarCollapsed,
    viewMode,
    dateRange,
    customStart,
    customEnd,
    dateRangeLabel,
    toggleSidebar,
    setViewMode,
    setDateRange,
    setCustomRange,
  }
})
