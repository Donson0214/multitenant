<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useTenantStore } from '../../../stores/tenant.store'

const tenantStore = useTenantStore()
const activeTenant = computed(() => tenantStore.activeTenant)

const tabs = [
  { key: 'general', label: 'General' },
  { key: 'billing', label: 'Billing' },
  { key: 'api', label: 'API Keys' },
  { key: 'notifications', label: 'Notifications' },
]

const activeTab = ref('general')
const saveMessage = ref('')

const settings = reactive({
  workspaceName: '',
  workspaceSlug: '',
  publicDashboards: true,
  require2fa: false,
})

const SETTINGS_KEY = 'analytics-settings'

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const loadSettings = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<typeof settings>
    settings.workspaceName = stored.workspaceName ?? activeTenant.value?.name ?? 'Workspace'
    settings.workspaceSlug = stored.workspaceSlug ?? slugify(settings.workspaceName)
    settings.publicDashboards = stored.publicDashboards ?? true
    settings.require2fa = stored.require2fa ?? false
  } catch {
    settings.workspaceName = activeTenant.value?.name ?? 'Workspace'
    settings.workspaceSlug = slugify(settings.workspaceName)
  }
}

const saveSettings = () => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  saveMessage.value = 'Settings saved.'
  setTimeout(() => {
    saveMessage.value = ''
  }, 2000)
}

watch(
  () => settings.workspaceName,
  (value) => {
    if (!settings.workspaceSlug) {
      settings.workspaceSlug = slugify(value)
    }
  }
)

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <section class="mx-auto w-full max-w-5xl">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Settings</h1>
      <p class="mt-1 text-sm text-slate-500">Manage your workspace preferences and configuration</p>
    </div>

    <div class="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-500">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="rounded-xl px-3 py-1.5"
        :class="activeTab === tab.key ? 'bg-slate-900 text-white' : ''"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div v-if="activeTab !== 'general'" class="text-sm text-slate-500">
        Settings for {{ tabs.find((tab) => tab.key === activeTab)?.label }} are coming soon.
      </div>

      <div v-else class="grid gap-6">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Workspace Settings</h2>
          <p class="mt-1 text-sm text-slate-500">Configure your default workspace preferences.</p>
        </div>

        <div class="grid gap-4">
          <div class="grid gap-2">
            <label class="text-xs font-semibold text-slate-600">Workspace Name</label>
            <input
              v-model="settings.workspaceName"
              type="text"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <div class="grid gap-2">
            <label class="text-xs font-semibold text-slate-600">Workspace URL</label>
            <div class="flex items-center gap-2">
              <span class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">analytics.app/</span>
              <input
                v-model="settings.workspaceSlug"
                type="text"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              />
            </div>
          </div>
        </div>

        <div class="border-t border-slate-200 pt-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-900">Enable Public Dashboards</p>
              <p class="text-xs text-slate-500">Allow sharing dashboards via public link</p>
            </div>
            <input v-model="settings.publicDashboards" type="checkbox" class="h-4 w-4 accent-slate-900" />
          </div>
          <div class="mt-4 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-900">Require 2FA</p>
              <p class="text-xs text-slate-500">Require two-factor authentication for all users</p>
            </div>
            <input v-model="settings.require2fa" type="checkbox" class="h-4 w-4 accent-slate-900" />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            @click="loadSettings"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm"
            @click="saveSettings"
          >
            Save Changes
          </button>
        </div>

        <p v-if="saveMessage" class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {{ saveMessage }}
        </p>
      </div>
    </div>
  </section>
</template>
