<script setup lang="ts">
import { authClient } from '../../utils/auth-client'

definePageMeta({
  layout: 'default',
})

const loading = ref(false)
const error = ref('')

async function pick(role: 'teacher' | 'student') {
  if (loading.value) return
  loading.value = true
  error.value = ''

  try {
    await $fetch('/api/visitor/role', {
      method: 'POST',
      body: { role },
    })
    // Refresh the reactive session so visitor/index.vue sees the new role
    await authClient.getSession()
    await navigateTo('/visitor')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to update role. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="text-center max-w-sm w-full">
      <h1 class="text-3xl font-bold mb-2">
        Welcome!
      </h1>
      <p class="text-muted mb-8">
        Tell us who you are to get started.
      </p>

      <UAlert
        v-if="error"
        color="error"
        :description="error"
        class="mb-6 text-left"
      />

      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <UButton
          size="xl"
          class="flex-1"
          :loading="loading"
          @click="pick('teacher')"
        >
          I'm a Teacher
        </UButton>

        <UButton
          size="xl"
          color="neutral"
          variant="outline"
          class="flex-1"
          :loading="loading"
          @click="pick('student')"
        >
          I'm a Student
        </UButton>
      </div>
    </div>
  </div>
</template>
