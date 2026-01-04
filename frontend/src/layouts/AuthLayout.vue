<script setup lang="ts">
const openSupport = () => {
  window.location.href = 'mailto:support@analytics.com'
}
</script>

<template>
  <div class="auth-shell">
    <div class="auth-card">
      <div class="auth-brand">
        <span class="brand-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path
              d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span>Analytics</span>
      </div>
      <slot />
    </div>
    <button class="help-fab" type="button" aria-label="Help" @click="openSupport">
      ?
    </button>
  </div>
</template>
