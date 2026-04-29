<script setup lang="ts">
import { shallowRef } from 'vue'

const { login } = useAuth()

const email = shallowRef('')
const password = shallowRef('')
const error = shallowRef('')
const loading = shallowRef(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    await login(email.value, password.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <AuthGoogleButton @error="error = $event" />

    <USeparator label="or" />

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
        placeholder="At least 8 characters"
        required
        autocomplete="current-password"
        class="w-full"
      />
    </UFormField>

    <UAlert v-if="error" color="error" :description="error" />

    <UButton type="submit" block :loading="loading">
      Sign in
    </UButton>

    <p class="text-sm text-center text-muted">
      Don't have an account?
      <NuxtLink to="/auth/register" class="text-primary hover:underline">
        Register
      </NuxtLink>
    </p>
  </form>
</template>
