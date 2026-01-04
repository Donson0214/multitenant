<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { Plus, Search, X } from 'lucide-vue-next'
import { inviteUser, listUsers, removeUser, updateUserRole } from '../../../services/users.api'
import type { AppUser } from '../../../types/user'

const users = ref<AppUser[]>([])
const loading = ref(false)
const error = ref('')
const query = ref('')

const modalOpen = ref(false)
const isSubmitting = ref(false)
const formError = ref('')
const roleSaving = reactive<Record<string, boolean>>({})

const form = reactive({
  email: '',
  role: 'ANALYST',
})

const demoUsers: AppUser[] = [
  { id: 'demo-1', name: 'Alex Chen', email: 'alex.chen@acmecorp.com', role: 'OWNER', createdAt: new Date().toISOString() },
  { id: 'demo-2', name: 'Sarah Johnson', email: 'sarah.j@acmecorp.com', role: 'ADMIN', createdAt: new Date().toISOString() },
  { id: 'demo-3', name: 'Michael Brown', email: 'michael.b@acmecorp.com', role: 'ANALYST', createdAt: new Date().toISOString() },
  { id: 'demo-4', name: 'Emily Davis', email: 'emily.d@acmecorp.com', role: 'VIEWER', createdAt: new Date().toISOString() },
  { id: 'demo-5', name: 'James Wilson', email: 'james.w@acmecorp.com', role: 'ANALYST', createdAt: new Date().toISOString() },
]

const usersForView = computed(() => (users.value.length ? users.value : demoUsers))

const filteredUsers = computed(() => {
  if (!query.value.trim()) return usersForView.value
  const needle = query.value.toLowerCase()
  return usersForView.value.filter((user) => {
    const name = user.name?.toLowerCase() ?? ''
    return name.includes(needle) || user.email.toLowerCase().includes(needle)
  })
})

const roleCounts = computed(() => {
  const counts = { OWNER: 0, ADMIN: 0, ANALYST: 0, VIEWER: 0 }
  usersForView.value.forEach((user) => {
    const role = (user.role ?? 'VIEWER').toUpperCase()
    if (role in counts) {
      counts[role as keyof typeof counts] += 1
    }
  })
  return counts
})

const formatRelative = (value?: string) => {
  if (!value) return 'Recently'
  const now = dayjs()
  const date = dayjs(value)
  const minutes = now.diff(date, 'minute')
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = now.diff(date, 'hour')
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = now.diff(date, 'day')
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const roleBadgeClass = (role?: string) => {
  const normalized = (role ?? '').toUpperCase()
  if (normalized === 'OWNER') return 'bg-purple-100 text-purple-600'
  if (normalized === 'ADMIN') return 'bg-blue-100 text-blue-600'
  if (normalized === 'ANALYST') return 'bg-emerald-100 text-emerald-600'
  return 'bg-slate-100 text-slate-600'
}

const resetForm = () => {
  form.email = ''
  form.role = 'ANALYST'
  formError.value = ''
}

const openModal = () => {
  resetForm()
  modalOpen.value = true
}

const loadUsers = async () => {
  loading.value = true
  error.value = ''
  try {
    users.value = await listUsers()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load users.'
  } finally {
    loading.value = false
  }
}

const handleInvite = async () => {
  formError.value = ''
  if (!form.email.trim()) {
    formError.value = 'Email is required.'
    return
  }
  isSubmitting.value = true
  try {
    await inviteUser({ email: form.email.trim(), role: form.role })
    await loadUsers()
    modalOpen.value = false
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Unable to invite user.'
  } finally {
    isSubmitting.value = false
  }
}

const handleRoleChange = async (user: AppUser, nextRole: string) => {
  roleSaving[user.id] = true
  try {
    await updateUserRole(user.id, nextRole)
    users.value = users.value.map((item) => (item.id === user.id ? { ...item, role: nextRole } : item))
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to update role.'
  } finally {
    roleSaving[user.id] = false
  }
}

const handleRemove = async (user: AppUser) => {
  if (!window.confirm(`Remove ${user.name ?? user.email}?`)) return
  try {
    await removeUser(user.id)
    users.value = users.value.filter((item) => item.id !== user.id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to remove user.'
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <section class="mx-auto w-full max-w-5xl">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Users & Roles</h1>
        <p class="mt-1 text-sm text-slate-500">Manage team members and their permissions</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
        @click="openModal"
      >
        <Plus class="h-4 w-4" />
        Invite User
      </button>
    </div>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <div class="relative flex min-w-[240px] flex-1 items-center">
        <Search class="absolute left-3 h-4 w-4 text-slate-400" />
        <input
          v-model="query"
          type="search"
          placeholder="Search users..."
          class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 shadow-sm"
        />
      </div>
    </div>

    <p v-if="error" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
      {{ error }} Using demo data for layout.
    </p>

    <div class="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs text-slate-500">Owner</p>
        <p class="mt-2 text-2xl font-semibold text-purple-600">{{ roleCounts.OWNER }}</p>
        <p class="mt-2 text-xs text-slate-400">Full access & billing</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs text-slate-500">Admins</p>
        <p class="mt-2 text-2xl font-semibold text-blue-600">{{ roleCounts.ADMIN }}</p>
        <p class="mt-2 text-xs text-slate-400">Manage users & settings</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs text-slate-500">Analysts</p>
        <p class="mt-2 text-2xl font-semibold text-emerald-600">{{ roleCounts.ANALYST }}</p>
        <p class="mt-2 text-xs text-slate-400">Create & edit content</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs text-slate-500">Viewers</p>
        <p class="mt-2 text-2xl font-semibold text-slate-700">{{ roleCounts.VIEWER }}</p>
        <p class="mt-2 text-xs text-slate-400">Read-only access</p>
      </div>
    </div>

    <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="grid grid-cols-[2fr_1fr_1fr_1fr_0.6fr] gap-4 border-b border-slate-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        <span>User</span>
        <span>Role</span>
        <span>Status</span>
        <span>Last Active</span>
        <span></span>
      </div>
      <div v-if="loading" class="px-5 py-6 text-sm text-slate-500">Loading users...</div>
      <div v-else-if="filteredUsers.length === 0" class="px-5 py-6 text-sm text-slate-500">
        No users found.
      </div>
      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="grid grid-cols-[2fr_1fr_1fr_1fr_0.6fr] gap-4 px-5 py-4 text-sm text-slate-700"
        >
          <div class="flex items-center gap-3">
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              {{ (user.name ?? user.email).slice(0, 2).toUpperCase() }}
            </span>
            <div>
              <p class="font-semibold text-slate-900">
                {{ user.name ?? user.email }}
                <span v-if="user.role === 'OWNER'" class="text-xs text-slate-400">(You)</span>
              </p>
              <p class="text-xs text-slate-500">{{ user.email }}</p>
            </div>
          </div>
          <div>
            <select
              :value="user.role ?? 'VIEWER'"
              class="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600"
              :class="roleBadgeClass(user.role)"
              :disabled="roleSaving[user.id]"
              @change="handleRoleChange(user, ($event.target as HTMLSelectElement).value)"
            >
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="ANALYST">Analyst</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          <div>
            <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              Active
            </span>
          </div>
          <div class="text-xs text-slate-500">{{ formatRelative(user.createdAt) }}</div>
          <div class="text-right">
            <button
              type="button"
              class="text-xs font-semibold text-rose-500"
              @click="handleRemove(user)"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <TransitionRoot :show="modalOpen" as="template">
      <Dialog class="relative z-50" @close="modalOpen = false">
        <TransitionChild
          as="template"
          enter="ease-out duration-200"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-150"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-slate-900/40" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as="template"
              enter="ease-out duration-200"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="ease-in duration-150"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl">
                <div class="flex items-start justify-between">
                  <div>
                    <DialogTitle class="text-lg font-semibold text-slate-900">
                      Invite User
                    </DialogTitle>
                    <p class="mt-1 text-sm text-slate-500">Add an existing user to this tenant.</p>
                  </div>
                  <button
                    type="button"
                    class="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                    @click="modalOpen = false"
                  >
                    <X class="h-4 w-4" />
                  </button>
                </div>

                <div class="mt-4 grid gap-4">
                  <div class="grid gap-2">
                    <label class="text-xs font-semibold text-slate-600">Email</label>
                    <input
                      v-model="form.email"
                      type="email"
                      placeholder="user@company.com"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    />
                  </div>
                  <div class="grid gap-2">
                    <label class="text-xs font-semibold text-slate-600">Role</label>
                    <select
                      v-model="form.role"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="ANALYST">Analyst</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  </div>
                  <p v-if="formError" class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    {{ formError }}
                  </p>
                </div>

                <div class="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
                    @click="modalOpen = false"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
                    :disabled="isSubmitting"
                    @click="handleInvite"
                  >
                    {{ isSubmitting ? 'Inviting...' : 'Invite User' }}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </section>
</template>
