<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '../../layouts/AuthLayout.vue'
import { registerWithEmail } from '../../services/auth.api'
import { createTenant } from '../../services/tenants.api'
import { useTenantStore } from '../../stores/tenant.store'
import { isAxiosError } from 'axios'

const step = ref<1 | 2>(1)
const status = ref('')
const isLoading = ref(false)
const router = useRouter()
const tenantStore = useTenantStore()

const form = reactive({
  fullName: '',
  email: '',
  password: '',
  workspace: '',
  teamSize: '1-5',
})

const canContinue = computed(() => {
  return (
    form.fullName.trim().length > 1 &&
    form.email.trim().length > 0 &&
    form.password.trim().length >= 8
  )
})

const canFinish = computed(() => {
  return form.workspace.trim().length > 1
})

const goToStep = (target: 1 | 2) => {
  if (target === 2 && !canContinue.value) {
    status.value = 'Complete the account details first.'
    return
  }
  status.value = ''
  step.value = target
}

const handleContinue = () => {
  if (!canContinue.value) {
    status.value = 'Use a valid name, email, and password.'
    return
  }
  status.value = ''
  step.value = 2
}

const resolveAuthError = (err: unknown) => {
  if (isAxiosError(err)) {
    if (err.response?.status === 409) {
      return 'You already belong to a workspace. Signing you in.'
    }
    return err.response?.data?.message ?? 'Request failed.'
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'Unable to create account.'
}

const handleSubmit = async () => {
  status.value = ''
  if (step.value === 1) {
    handleContinue()
    return
  }
  if (!canFinish.value) {
    status.value = 'Add a workspace name to finish.'
    return
  }
  isLoading.value = true
  try {
    await registerWithEmail({
      email: form.email,
      password: form.password,
      name: form.fullName,
    })
    await createTenant({ name: form.workspace })
    const needsOnboarding = await tenantStore.bootstrap()
    if (needsOnboarding) {
      router.push('/onboarding')
      return
    }
    router.push('/analytics/dashboards')
  } catch (err) {
    const message = resolveAuthError(err)
    status.value = message
    if (message.includes('workspace')) {
      const needsOnboarding = await tenantStore.bootstrap()
      if (needsOnboarding) {
        router.push('/onboarding')
        return
      }
      router.push('/analytics/dashboards')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div class="stepper stagger-1">
      <div class="step" @click="goToStep(1)">
        <div class="step-circle" :data-active="step === 1">1</div>
        <span class="step-label" :data-active="step === 1">Account</span>
      </div>
      <span class="step-line" aria-hidden="true"></span>
      <div class="step" @click="goToStep(2)">
        <div class="step-circle" :data-active="step === 2">2</div>
        <span class="step-label" :data-active="step === 2">Workspace</span>
      </div>
    </div>

    <div class="auth-intro stagger-2">
      <h1 class="auth-title">Create your account</h1>
      <p class="auth-subtitle">Get started with Analytics & Automation</p>
    </div>

    <form class="form-stack stagger-3" @submit.prevent="handleSubmit">
      <div v-if="step === 1" class="form-stack">
        <div class="field">
          <label for="register-name">Full Name</label>
          <div class="input-shell">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M4 20a8 8 0 0 1 16 0"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <input
              id="register-name"
              v-model="form.fullName"
              type="text"
              autocomplete="name"
              placeholder="Alex Chen"
            />
          </div>
        </div>

        <div class="field">
          <label for="register-email">Work Email</label>
          <div class="input-shell">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="m22 8-10 6L2 8"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <input
              id="register-email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              placeholder="you@company.com"
            />
          </div>
        </div>

        <div class="field">
          <label for="register-password">Password</label>
          <div class="input-shell">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 10V8a5 5 0 0 1 10 0v2"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <rect
                x="4"
                y="10"
                width="16"
                height="10"
                rx="2"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
            <input
              id="register-password"
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              placeholder="********"
            />
          </div>
          <span class="input-hint">Must be at least 8 characters</span>
        </div>

        <button class="auth-button" type="button" @click="handleContinue">
          Continue
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
            <path
              d="M5 12h14"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="m13 6 6 6-6 6"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <p class="auth-caption">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      <div v-else class="form-stack">
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
            <input
              id="workspace-name"
              v-model="form.workspace"
              type="text"
              placeholder="Acme Operations"
            />
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

        <div class="form-meta">
          <button class="link" type="button" @click="goToStep(1)">Back</button>
          <span class="auth-subtitle">Step 2 of 2</span>
        </div>

        <button class="auth-button" type="submit" :disabled="isLoading">
          {{ isLoading ? 'Creating workspace...' : 'Create Workspace' }}
        </button>
      </div>
    </form>

    <p v-if="status" class="auth-feedback">{{ status }}</p>

    <p class="auth-footer stagger-4">
      Already have an account?
      <RouterLink class="link" to="/login">Sign in</RouterLink>
    </p>
  </AuthLayout>
</template>
