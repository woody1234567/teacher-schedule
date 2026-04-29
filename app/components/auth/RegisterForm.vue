<script setup lang="ts">
import { shallowRef } from 'vue'

type AuthRole = 'student' | 'teacher'

const { register } = useAuth()

const name = shallowRef('')
const email = shallowRef('')
const password = shallowRef('')
const role = shallowRef<AuthRole>('student')
const error = shallowRef('')
const loading = shallowRef(false)

const roleOptions = [
  { label: 'Student', value: 'student' },
  { label: 'Teacher', value: 'teacher' },
]

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    await register(email.value, password.value, name.value, role.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <AuthGoogleButton @error="error = $event" />

    <USeparator label="or" />

    <UFormField label="Name" name="name">
      <UInput
        v-model="name"
        type="text"
        placeholder="Your name"
        required
        autocomplete="name"
        class="w-full"
      />
    </UFormField>

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
        placeholder="Min 8 chars, 1 uppercase, 1 number"
        required
        autocomplete="new-password"
        class="w-full"
      />
    </UFormField>

    <UFormField label="I am a" name="role">
      <USelect
        v-model="role"
        :items="roleOptions"
        class="w-full"
      />
    </UFormField>

    <UAlert v-if="error" color="error" :description="error" />

    <UButton type="submit" block :loading="loading">
      Create account
    </UButton>

    <p class="text-sm text-center text-muted">
      Already have an account?
      <NuxtLink to="/auth/login" class="text-primary hover:underline">
        Sign in
      </NuxtLink>
    </p>
  </form>
</template>
