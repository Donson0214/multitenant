<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { ChevronDown, LogOut, Settings, User } from 'lucide-vue-next'
import { onIdTokenChanged, type User as FirebaseUser } from 'firebase/auth'
import { useTenantStore } from '../../stores/tenant.store'
import { getFirebaseAuth } from '../../services/firebase'

const tenantStore = useTenantStore()
const firebaseUser = ref<FirebaseUser | null>(null)
let unsubscribe: (() => void) | null = null

onMounted(() => {
  try {
    const auth = getFirebaseAuth()
    firebaseUser.value = auth.currentUser
    unsubscribe = onIdTokenChanged(auth, (user) => {
      firebaseUser.value = user
    })
  } catch {
    firebaseUser.value = null
  }
})

onBeforeUnmount(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

const displayName = computed(() => {
  return (
    tenantStore.user?.name ||
    firebaseUser.value?.displayName ||
    tenantStore.user?.email ||
    firebaseUser.value?.email ||
    'Alex Chen'
  )
})

const displayRole = computed(() => {
  const role = tenantStore.user?.role
  if (!role) return 'Owner'
  const normalized = role.toUpperCase()
  if (normalized === 'OWNER') return 'Owner'
  if (normalized === 'ADMIN') return 'Admin'
  if (normalized === 'ANALYST') return 'Analyst'
  if (normalized === 'VIEWER') return 'Viewer'
  return role
})

const initials = computed(() => {
  const name = displayName.value
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
})
</script>

<template>
  <Menu as="div" class="relative">
    <MenuButton
      class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-slate-300"
    >
      <span
        class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700"
      >
        {{ initials }}
      </span>
      <div class="hidden sm:block">
        <p class="text-sm font-semibold text-slate-900">
          {{ displayName }}
        </p>
        <p class="text-xs text-slate-500">
          {{ displayRole }}
        </p>
      </div>
      <ChevronDown class="h-4 w-4 text-slate-500" />
    </MenuButton>
    <MenuItems
      class="absolute right-0 z-20 mt-2 w-40 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-lg"
    >
      <MenuItem v-slot="{ active }">
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left"
          :class="active ? 'bg-slate-100 text-slate-900' : 'text-slate-600'"
        >
          <User class="h-4 w-4" />
          Profile
        </button>
      </MenuItem>
      <MenuItem v-slot="{ active }">
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left"
          :class="active ? 'bg-slate-100 text-slate-900' : 'text-slate-600'"
        >
          <Settings class="h-4 w-4" />
          Settings
        </button>
      </MenuItem>
      <MenuItem v-slot="{ active }">
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left"
          :class="active ? 'bg-slate-100 text-slate-900' : 'text-slate-600'"
        >
          <LogOut class="h-4 w-4" />
          Sign out
        </button>
      </MenuItem>
    </MenuItems>
  </Menu>
</template>
