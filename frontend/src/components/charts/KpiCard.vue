<script setup lang="ts">
const props = defineProps<{
  title: string
  value: string
  change?: string
  live?: boolean
  loading?: boolean
}>()
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex items-center justify-between">
      <p class="text-sm font-semibold text-slate-700">{{ props.title }}</p>
      <span
        v-if="props.live"
        class="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600"
      >
        Live
      </span>
    </div>
    <div class="mt-4 text-2xl font-semibold text-slate-900">
      <span v-if="props.loading" class="animate-pulse text-slate-300">--</span>
      <span v-else>{{ props.value }}</span>
    </div>
    <p v-if="props.change" class="mt-2 text-xs font-semibold text-emerald-600">
      {{ props.change }}
    </p>
  </div>
</template>
