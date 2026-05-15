<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { user } = useAuth()

const roleLabel = computed(() => {
  if (user.value?.role === 'teacher') return 'Teacher'
  if (user.value?.role === 'student') return 'Student'
  return 'Member'
})

const dashboardPath = computed(() => {
  if (user.value?.role === 'teacher') return '/teacher'
  if (user.value?.role === 'student') return '/student'
  return '/'
})
</script>

<template>
  <UContainer class="py-20">
    <div class="text-center max-w-md mx-auto">
      <UIcon
        name="i-heroicons-check-circle"
        class="text-success w-16 h-16 mx-auto mb-6"
      />

      <h1 class="text-3xl font-bold mb-2">
        You're all set!
      </h1>

      <p class="text-muted mb-8">
        Your role has been set to <strong>{{ roleLabel }}</strong>.
        Head to your dashboard to get started.
      </p>

      <UButton
        :to="dashboardPath"
        size="lg"
      >
        Go to Dashboard
      </UButton>
    </div>
  </UContainer>
</template>
