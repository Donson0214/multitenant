<script setup lang="ts">
import { ref, watch } from 'vue'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { Calendar, Check } from 'lucide-vue-next'
import { useUiStore } from '../../stores/ui.store'

const ui = useUiStore()

const rangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
] as const

const customStart = ref(ui.customStart)
const customEnd = ref(ui.customEnd)

watch(
  () => [ui.customStart, ui.customEnd],
  ([start, end]) => {
    customStart.value = start
    customEnd.value = end
  }
)
</script>

<template>
  <Popover class="relative">
    <PopoverButton
      class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
    >
      <Calendar class="h-4 w-4 text-slate-500" />
      <span>{{ ui.dateRangeLabel }}</span>
    </PopoverButton>
    <PopoverPanel
      v-slot="{ close }"
      class="absolute left-0 z-20 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-lg"
    >
      <div class="space-y-2">
        <button
          v-for="option in rangeOptions"
          :key="option.value"
          type="button"
          class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-slate-600 transition hover:bg-slate-100"
          @click="
            () => {
              ui.setDateRange(option.value)
              if (option.value !== 'custom') {
                close()
              }
            }
          "
        >
          <span>{{ option.label }}</span>
          <Check v-if="ui.dateRange === option.value" class="h-4 w-4 text-blue-600" />
        </button>
      </div>

      <div v-if="ui.dateRange === 'custom'" class="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div class="grid gap-2">
          <label class="text-xs font-semibold text-slate-600">Start</label>
          <input
            v-model="customStart"
            type="date"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          />
          <label class="text-xs font-semibold text-slate-600">End</label>
          <input
            v-model="customEnd"
            type="date"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          />
          <button
            type="button"
            class="mt-2 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm"
            @click="
              () => {
                if (customStart && customEnd) {
                  ui.setCustomRange(customStart, customEnd)
                  close()
                }
              }
            "
          >
            Apply Range
          </button>
        </div>
      </div>
    </PopoverPanel>
  </Popover>
</template>
