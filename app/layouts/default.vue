<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { session, logout } = useAuth()
const user = computed(() => session.value?.data?.user)

const items = computed<NavigationMenuItem[]>(() => {
  const baseItems: NavigationMenuItem[] = [
    { label: 'Home', to: '/' },
  ]

  if ((user.value as { role?: string } | undefined)?.role === 'admin') {
    baseItems.push({ label: 'Admin', to: '/admin' })
  }

  return baseItems
})

async function handleLogout() {
  try {
    await logout()
  } catch {
    // ignore
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <UHeader>
      <template #title>
        <span class="text-xl font-bold tracking-tight">Teacher Schedule</span>
      </template>

      <UNavigationMenu :items="items" />

      <template #right>
        <UColorModeButton />
        <template v-if="user">
          <span class="text-sm text-muted">{{ user.name }}</span>
          <UButton label="Logout" color="neutral" variant="ghost" @click="handleLogout" />
        </template>
        <template v-else>
          <UButton label="Login" color="neutral" variant="ghost" to="/auth/login" />
          <UButton label="Register" to="/auth/register" />
        </template>
      </template>

      <template #body>
        <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
        <template v-if="user">
          <UButton label="Logout" color="neutral" variant="ghost" block @click="handleLogout" />
        </template>
        <template v-else>
          <div class="flex gap-2 mt-2">
            <UButton label="Login" color="neutral" variant="ghost" to="/auth/login" block />
            <UButton label="Register" to="/auth/register" block />
          </div>
        </template>
      </template>
    </UHeader>

    <UMain class="flex-grow">
      <slot />
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-muted text-sm">Copyright © {{ new Date().getFullYear() }} Teacher Schedule</p>
      </template>
      <template #right>
        <UButton icon="i-simple-icons-github" color="neutral" variant="ghost" to="https://github.com" target="_blank" />
      </template>
    </UFooter>
  </div>
</template>
