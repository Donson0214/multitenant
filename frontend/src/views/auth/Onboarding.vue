<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '../../layouts/AuthLayout.vue'
import { createTenant } from '../../services/tenants.api'
import { useTenantStore } from '../../stores/tenant.store'

const router = useRouter()
const tenantStore = useTenantStore()
const status = ref('')
const isLoading = ref(false)

const form = reactive({
  workspace: '',
  teamSize: '1-5',
})

const handleSubmit = async () => {
  status.value = ''
  if (!form.workspace.trim()) {
    status.value = 'Workspace name is required.'
    return
  }
  isLoading.value = true
  try {
    await createTenant({ name: form.workspace.trim() })
    await tenantStore.bootstrap()
    router.push('/analytics/dashboards')
  } catch (err) {
    status.value = err instanceof Error ? err.message : 'Unable to create workspace.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div class="auth-intro stagger-1">
      <h1 class="auth-title">Create your workspace</h1>
      <p class="auth-subtitle">Set up a tenant before you access dashboards.</p>
    </div>

    <form class="form-stack stagger-2" @submit.prevent="handleSubmit">
      <div class="field">
        <label for="workspace-name">Workspace Name</label>
        <div class="input-shell">
          <svg class="input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 7h18v10H3z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
            <path
              d="M7 7V5h10v2"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          <input id="workspace-name" v-model="form.workspace" type="text" placeholder="Acme Operations" />
        </div>
      </div>

      <div class="field">
        <label for="team-size">Team Size</label>
        <div class="input-shell">
          <svg class="input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path
              d="M8 13a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path
              d="M2 20a6 6 0 0 1 10 0"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M12 20a6 6 0 0 1 10 0"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          <select id="team-size" v-model="form.teamSize">
            <option value="1-5">1-5 people</option>
            <option value="6-15">6-15 people</option>
            <option value="16-40">16-40 people</option>
            <option value="40+">40+ people</option>
          </select>
        </div>
      </div>

      <button class="auth-button" type="submit" :disabled="isLoading">
        {{ isLoading ? 'Creating workspace...' : 'Create Workspace' }}
      </button>
    </form>

    <p v-if="status" class="auth-feedback">{{ status }}</p>
  </AuthLayout>
</template>
