<script setup lang="ts">
import { computed } from 'vue'
import {
  LayoutGrid,
  BarChart3,
  Database,
  Table2,
  Zap,
  Bell,
  Users,
  FileText,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'
import SidebarItem from './SidebarItem.vue'
import { useUiStore } from '../../stores/ui.store'

const ui = useUiStore()
const collapsed = computed(() => ui.sidebarCollapsed)

const sections = [
  {
    title: 'Analytics',
    items: [
      { label: 'Dashboards', to: '/analytics/dashboards', icon: LayoutGrid },
      { label: 'Metrics', to: '/analytics/metrics', icon: BarChart3 },
      { label: 'Data Sources', to: '/analytics/data-sources', icon: Database },
      { label: 'Datasets', to: '/analytics/datasets', icon: Table2 },
      { label: 'Automations', to: '/analytics/automations', icon: Zap },
      { label: 'Notifications', to: '/analytics/notifications', icon: Bell },
    ],
  },
  {
    title: 'Access',
    items: [
      { label: 'Users & Roles', to: '/analytics/users', icon: Users },
      { label: 'Audit Logs', to: '/analytics/audit-logs', icon: FileText },
      { label: 'Settings', to: '/analytics/settings', icon: Settings },
    ],
  },
  {
    title: 'Admin',
    items: [{ label: 'Admin', to: '/admin', icon: Shield }],
  },
]
</script>

<template>
  <aside
    class="relative flex min-h-screen flex-col border-r border-slate-200/70 bg-white/90 px-3 pb-6 pt-5 shadow-sm backdrop-blur"
    :class="collapsed ? 'w-[84px]' : 'w-72'"
  >
    <div class="flex items-center gap-3 px-2 pb-4">
      <div
        class="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-md"
      >
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <div v-if="!collapsed" class="flex flex-1 flex-col">
        <span class="text-sm font-semibold text-slate-900">Analytics</span>
        <span class="text-xs text-slate-500">Workspace</span>
      </div>
      <button
        class="rounded-full border border-slate-200 bg-white p-1 text-slate-500 transition hover:text-slate-800"
        type="button"
        @click="ui.toggleSidebar"
        aria-label="Toggle sidebar"
      >
        <component :is="collapsed ? ChevronRight : ChevronLeft" class="h-4 w-4" />
      </button>
    </div>

    <nav class="flex-1 space-y-5">
      <div v-for="section in sections" :key="section.title" class="space-y-2">
        <p v-if="!collapsed" class="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          {{ section.title }}
        </p>
        <div class="space-y-1">
          <SidebarItem
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            :label="item.label"
            :icon="item.icon"
            :collapsed="collapsed"
          />
        </div>
      </div>
    </nav>
  </aside>
</template>
