<script setup lang="ts">
import Sidebar from '../components/layout/Sidebar.vue'
import TopBar from '../components/layout/TopBar.vue'
</script>

<template>
  <div class="min-h-screen bg-transparent">
    <div class="flex min-h-screen">
      <Sidebar />
      <div class="flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main class="flex-1 px-6 pb-10 pt-6 sm:px-8">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>
