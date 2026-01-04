<script setup lang="ts">
import { Bell } from 'lucide-vue-next'
</script>

<template>
  <button
    type="button"
    class="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
    aria-label="Notifications"
  >
    <Bell class="h-4 w-4" />
    <span class="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
  </button>
</template>
