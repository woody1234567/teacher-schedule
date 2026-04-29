<script setup lang="ts">
definePageMeta({ auth: false })

const { login } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-2xl font-bold text-center">Sign in</h1>
      </template>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <UFormField label="Email" name="email">
          <UInput
            v-model="email"
            type="email"
            placeholder="you@example.com"
            required
            autocomplete="email"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            autocomplete="current-password"
            class="w-full"
          />
        </UFormField>

        <UAlert v-if="error" color="error" :description="error" />

        <UButton type="submit" block :loading="loading">
          Sign in
        </UButton>
      </form>

      <template #footer>
        <p class="text-sm text-center text-gray-500">
          Don't have an account?
          <NuxtLink to="/auth/register" class="text-primary hover:underline">Register</NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
