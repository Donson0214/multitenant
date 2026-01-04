<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { Check, ChevronDown } from 'lucide-vue-next'
import { useTenantStore } from '../../stores/tenant.store'

const tenantStore = useTenantStore()

onMounted(() => {
  tenantStore.bootstrap()
})

const selectedTenant = computed({
  get: () => tenantStore.activeTenant,
  set: (tenant) => {
    if (tenant) {
      tenantStore.setActiveTenant(tenant.id)
    }
  },
})
</script>

<template>
  <Listbox v-model="selectedTenant" as="div" class="relative">
    <ListboxButton
      class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-slate-300"
    >
      <div class="flex flex-1 items-center gap-2">
        <span class="text-sm font-semibold text-slate-900">
          {{ selectedTenant?.name ?? 'Select Org' }}
        </span>
        <span
          v-if="selectedTenant?.status"
          class="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
        >
          {{ selectedTenant.status }}
        </span>
      </div>
      <ChevronDown class="h-4 w-4 text-slate-500" />
    </ListboxButton>
    <ListboxOptions
      class="absolute left-0 z-20 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-lg"
    >
      <ListboxOption
        v-for="tenant in tenantStore.availableTenants"
        :key="tenant.id"
        :value="tenant"
        class="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-slate-600 hover:bg-slate-100"
      >
        <span class="flex items-center gap-2">
          <span class="font-semibold text-slate-900">{{ tenant.name }}</span>
          <span
            v-if="tenant.status"
            class="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500"
          >
            {{ tenant.status }}
          </span>
        </span>
        <Check
          v-if="selectedTenant?.id === tenant.id"
          class="h-4 w-4 text-blue-600"
        />
      </ListboxOption>
    </ListboxOptions>
  </Listbox>
</template>
