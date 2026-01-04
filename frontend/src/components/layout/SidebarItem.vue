<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  to: string
  label: string
  icon: unknown
  collapsed?: boolean
  badge?: string
}>()

const route = useRoute()
const isActive = computed(() => {
  if (route.path === props.to) {
    return true
  }
  return route.path.startsWith(`${props.to}/`)
})
</script>

<template>
  <RouterLink
    :to="to"
    class="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition"
    :class="[
      isActive
        ? 'bg-blue-50 text-blue-700 shadow-sm'
        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900',
      collapsed ? 'justify-center px-2' : '',
    ]"
  >
    <span
      class="grid h-9 w-9 place-items-center rounded-lg transition"
      :class="isActive ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-500 group-hover:text-slate-700'"
    >
      <component :is="icon" class="h-4 w-4" />
    </span>
    <span v-if="!collapsed" class="flex-1 truncate">{{ label }}</span>
    <span
      v-if="badge && !collapsed"
      class="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500"
    >
      {{ badge }}
    </span>
  </RouterLink>
</template>
