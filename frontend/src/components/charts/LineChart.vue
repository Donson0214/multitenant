<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
} from 'chart.js'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler)

const props = defineProps<{
  labels: string[]
  datasets: Array<{ label: string; data: number[] }>
  loading?: boolean
}>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map((dataset, index) => ({
    ...dataset,
    borderColor: index === 0 ? '#2f6bff' : '#94a3b8',
    backgroundColor: index === 0 ? 'rgba(47, 107, 255, 0.15)' : 'rgba(148, 163, 184, 0.12)',
    tension: 0.4,
    fill: true,
    pointRadius: 0,
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
  <div class="h-56">
    <div v-if="props.loading" class="flex h-full items-center justify-center text-sm text-slate-400">
      Loading chart...
    </div>
    <Line v-else :data="chartData" :options="options" />
  </div>
</template>
