<script setup lang="ts">
const props = defineProps<{
  columns: Array<{ key: string; label: string }>
  rows: Array<Record<string, string | number>>
}>()
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <table class="min-w-full text-left text-sm">
      <thead class="bg-slate-50 text-xs uppercase text-slate-500">
        <tr>
          <th v-for="column in props.columns" :key="column.key" class="px-4 py-3">
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in props.rows" :key="rowIndex" class="border-t border-slate-100">
          <td v-for="column in props.columns" :key="column.key" class="px-4 py-3 text-slate-700">
            {{ row[column.key] ?? '--' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
