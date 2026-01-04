<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { AlertTriangle, Bell, Check, Mail, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { listNotifications, markNotificationRead } from '../../../services/notifications.api'
import type { Notification } from '../../../types/notification'

const router = useRouter()
const notifications = ref<Notification[]>([])
const loading = ref(false)
const error = ref('')
const activeTab = ref<'unread' | 'all'>('unread')

const demoNotifications: Notification[] = [
  {
    id: 'demo-1',
    title: 'High Revenue Alert',
    body: 'Daily revenue exceeded $50k',
    type: 'IN_APP',
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
  },
  {
    id: 'demo-2',
    title: 'Data Source Connected',
    body: 'Marketing Campaigns data source successfully connected',
    type: 'IN_APP',
    createdAt: dayjs().subtract(5, 'hour').toISOString(),
  },
]

const notificationsForView = computed(() => (notifications.value.length ? notifications.value : demoNotifications))

const unreadNotifications = computed(() =>
  notificationsForView.value.filter((notification) => !notification.readAt)
)

const filteredNotifications = computed(() => {
  if (activeTab.value === 'unread') {
    return unreadNotifications.value
  }
  return notificationsForView.value
})

const formatRelative = (value: string) => {
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

const iconForNotification = (notification: Notification) => {
  if (notification.title.toLowerCase().includes('alert')) return AlertTriangle
  if (notification.type === 'EMAIL') return Mail
  return Bell
}

const loadNotifications = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await listNotifications({ pageSize: 50 })
    notifications.value = response.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load notifications.'
    notifications.value = demoNotifications
  } finally {
    loading.value = false
  }
}

const markAsRead = async (notification: Notification) => {
  if (notification.readAt) return
  try {
    const updated = await markNotificationRead(notification.id)
    notifications.value = notifications.value.map((item) => (item.id === updated.id ? updated : item))
  } catch {
    notifications.value = notifications.value.map((item) =>
      item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item
    )
  }
}

const markAllRead = async () => {
  await Promise.all(unreadNotifications.value.map((notification) => markAsRead(notification)))
}

onMounted(() => {
  loadNotifications()
})
</script>

<template>
  <section class="mx-auto w-full max-w-5xl">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Notifications</h1>
        <p class="mt-1 text-sm text-slate-500">Stay updated with alerts and system messages</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
          @click="markAllRead"
        >
          <Check class="h-4 w-4" />
          Mark all as read
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
          @click="router.back()"
        >
          <X class="h-4 w-4" />
          Close
        </button>
      </div>
    </div>

    <div class="mt-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-500">
      <button
        type="button"
        class="rounded-xl px-3 py-1.5"
        :class="activeTab === 'unread' ? 'bg-slate-900 text-white' : ''"
        @click="activeTab = 'unread'"
      >
        Unread
        <span v-if="unreadNotifications.length" class="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600">
          {{ unreadNotifications.length }}
        </span>
      </button>
      <button
        type="button"
        class="rounded-xl px-3 py-1.5"
        :class="activeTab === 'all' ? 'bg-slate-900 text-white' : ''"
        @click="activeTab = 'all'"
      >
        All
      </button>
    </div>

    <p v-if="error" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
      {{ error }} Using demo data for layout.
    </p>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="index in 2" :key="index" class="h-20 animate-pulse rounded-2xl bg-white shadow-sm" />
    </div>

    <div v-else class="mt-6 space-y-3">
      <div
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="flex items-start justify-between rounded-2xl border border-slate-200 bg-blue-50/40 px-4 py-3"
      >
        <div class="flex items-start gap-3">
          <div class="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
            <component :is="iconForNotification(notification)" class="h-4 w-4" />
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-900">{{ notification.title }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ notification.body }}</p>
            <p class="mt-2 text-xs text-slate-400">{{ formatRelative(notification.createdAt) }}</p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-2">
          <span
            class="h-2 w-2 rounded-full"
            :class="notification.readAt ? 'bg-slate-300' : 'bg-blue-500'"
          ></span>
          <button
            v-if="!notification.readAt"
            type="button"
            class="text-xs font-semibold text-blue-600"
            @click="markAsRead(notification)"
          >
            Mark read
          </button>
        </div>
      </div>

      <div v-if="!filteredNotifications.length" class="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">
        No notifications yet.
      </div>
    </div>
  </section>
</template>
