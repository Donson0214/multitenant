<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip)

const props = defineProps<{
  labels: string[]
  datasets: Array<{ label: string; data: number[] }>
  loading?: boolean
}>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map((dataset, index) => ({
    ...dataset,
    backgroundColor: index === 0 ? '#2f6bff' : '#94a3b8',
    borderRadius: 8,
  })),
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 10 } },
    },
    y: {
      grid: { color: '#e2e8f0' },
      ticks: { color: '#94a3b8', font: { size: 10 } },
    },
  },
}
</script>

<template>
  <div class="h-48">
    <div v-if="props.loading" class="flex h-full items-center justify-center text-sm text-slate-400">
      Loading chart...
    </div>
    <Bar v-else :data="chartData" :options="options" />
  </div>
</template>
