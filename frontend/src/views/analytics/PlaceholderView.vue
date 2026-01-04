<script setup lang="ts">
const props = defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h1 class="text-xl font-semibold text-slate-900">{{ props.title }}</h1>
    <p class="mt-2 text-sm text-slate-500">
      {{ props.description ?? 'This section is coming soon.' }}
    </p>
  </section>
</template>
