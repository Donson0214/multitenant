<script setup lang="ts">
import OrgSwitcher from './OrgSwitcher.vue'
import DateRangePicker from './DateRangePicker.vue'
import NotificationBell from './NotificationBell.vue'
import UserMenu from './UserMenu.vue'
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
    <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-8">
      <div class="flex flex-wrap items-center gap-3">
        <OrgSwitcher />
        <DateRangePicker />
      </div>
      <div class="flex items-center gap-3">
        <NotificationBell />
        <UserMenu />
      </div>
    </div>
  </header>
</template>
