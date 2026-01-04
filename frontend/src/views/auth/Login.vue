<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '../../layouts/AuthLayout.vue'
import { signInWithEmail, signInWithGoogle } from '../../services/auth.api'
import { useTenantStore } from '../../stores/tenant.store'

const router = useRouter()
const tenantStore = useTenantStore()

const form = reactive({
  email: '',
  password: '',
  remember: true,
})

const status = ref('')
const isLoading = ref(false)

const canSubmit = computed(() => {
  return form.email.trim().length > 0 && form.password.trim().length > 0
})

const resolveAuthError = (err: unknown) => {
  if (err instanceof Error) {
    return err.message
  }
  return 'Unable to sign in. Please try again.'
}

const handleSubmit = async () => {
  status.value = ''
  if (!canSubmit.value) {
    status.value = 'Enter your email and password to continue.'
    return
  }
  isLoading.value = true
  try {
    await signInWithEmail(form.email, form.password)
    const needsOnboarding = await tenantStore.bootstrap()
    if (needsOnboarding) {
      router.push('/onboarding')
      return
    }
    router.push('/analytics/dashboards')
  } catch (err) {
    status.value = resolveAuthError(err)
  } finally {
    isLoading.value = false
  }
}

const handleProvider = (provider: string) => {
  status.value = ''
  if (provider !== 'Google') {
    status.value = `${provider} sign-in is not configured yet.`
    return
  }
  isLoading.value = true
  signInWithGoogle()
    .then(async () => {
      const needsOnboarding = await tenantStore.bootstrap()
      if (needsOnboarding) {
        router.push('/onboarding')
        return
      }
      router.push('/analytics/dashboards')
    })
    .catch((err) => {
      status.value = resolveAuthError(err)
    })
    .finally(() => {
      isLoading.value = false
    })
}

const handleForgot = () => {
  status.value = 'Password reset is not configured yet.'
}
</script>

<template>
  <AuthLayout>
    <div class="auth-intro stagger-1">
      <h1 class="auth-title">Welcome back</h1>
      <p class="auth-subtitle">Sign in to your account to continue</p>
    </div>

    <form class="form-stack stagger-2" @submit.prevent="handleSubmit">
      <div class="field">
        <label for="login-email">Email</label>
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
            id="login-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="you@company.com"
          />
        </div>
      </div>

      <div class="field">
        <label for="login-password">Password</label>
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
            id="login-password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="********"
          />
        </div>
      </div>

      <div class="form-meta">
        <label class="checkbox">
          <input v-model="form.remember" type="checkbox" />
          <span>Remember me</span>
        </label>
        <button class="link" type="button" @click="handleForgot">Forgot password?</button>
      </div>

      <button class="auth-button" type="submit" :disabled="isLoading">
        {{ isLoading ? 'Signing in...' : 'Sign In' }}
      </button>
    </form>

    <div class="divider stagger-3">Or continue with</div>

    <div class="social-grid stagger-3">
      <button class="social-button" type="button" @click="handleProvider('Google')">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            d="M12 4.5c1.7 0 3.1.7 4.1 1.6l2.8-2.7C17.2 1.8 14.8 1 12 1 7.8 1 4.1 3.5 2.3 7.1l3.2 2.5C6.6 6.4 9.1 4.5 12 4.5Z"
            fill="currentColor"
          />
          <path
            d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.1a4.4 4.4 0 0 1-1.9 2.9l3 2.3c1.7-1.6 2.8-4 2.8-6.9Z"
            fill="currentColor"
          />
          <path
            d="M5.5 9.6 2.3 7.1A11 11 0 0 0 1 12c0 1.7.4 3.3 1.3 4.7l3.2-2.4A6.6 6.6 0 0 1 5.5 9.6Z"
            fill="currentColor"
          />
          <path
            d="M12 22c2.7 0 5-1 6.7-2.6l-3-2.3c-.8.5-1.9.8-3.7.8-2.8 0-5.2-1.9-6.1-4.6l-3.2 2.4C4.1 19.5 7.8 22 12 22Z"
            fill="currentColor"
          />
        </svg>
        Google
      </button>
      <button class="social-button" type="button" @click="handleProvider('GitHub')">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            d="M12 1.8a10.2 10.2 0 0 0-3.2 19.9c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.2-3.5-1.2-.5-1.2-1.3-1.6-1.3-1.6-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.3-.3-4.7-1.2-4.7-5.3 0-1.2.4-2.1 1.1-2.8-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.9 1.1.8-.2 1.7-.4 2.6-.4.9 0 1.8.1 2.6.4 2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.4.1 2.7.7.7 1.1 1.6 1.1 2.8 0 4.1-2.4 5-4.7 5.3.4.3.8 1 .8 2.1v3.1c0 .3.2.6.7.5A10.2 10.2 0 0 0 12 1.8Z"
            fill="currentColor"
          />
        </svg>
        GitHub
      </button>
    </div>

    <p v-if="status" class="auth-feedback">{{ status }}</p>

    <p class="auth-footer stagger-4">
      Don't have an account?
      <RouterLink class="link" to="/register">Sign up</RouterLink>
    </p>
  </AuthLayout>
</template>
