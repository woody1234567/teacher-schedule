<script setup lang="ts">
definePageMeta({ auth: false })

const { register } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await register(email.value, password.value, name.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-2xl font-bold text-center">Create account</h1>
      </template>

      <form class="space-y-4" @submit.prevent="handleSubmit">
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
            placeholder="••••••••"
            required
            autocomplete="new-password"
            class="w-full"
          />
        </UFormField>

        <UAlert v-if="error" color="error" :description="error" />

        <UButton type="submit" block :loading="loading">
          Create account
        </UButton>
      </form>

      <template #footer>
        <p class="text-sm text-center text-gray-500">
          Already have an account?
          <NuxtLink to="/auth/login" class="text-primary hover:underline">Sign in</NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
