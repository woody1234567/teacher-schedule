<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authClient } from '../../utils/auth-client'

definePageMeta({
  layout: 'default',
})

interface PendingRequest {
  id: number
  requestedRole: string
  createdAt: string
}

const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const pendingRequest = ref<PendingRequest | null>(null)
const toast = useToast()

onMounted(async () => {
  try {
    const data = await $fetch<PendingRequest | null>('/api/visitor/role-request')
    pendingRequest.value = data
  } catch {
    // No pending request or not authenticated; stay in pick state
  } finally {
    loading.value = false
  }
})

async function pick(role: 'teacher' | 'student') {
  if (submitting.value) return
  submitting.value = true
  error.value = ''

  try {
    const result = await $fetch<PendingRequest>('/api/visitor/role', {
      method: 'POST',
      body: { role },
    })
    pendingRequest.value = result
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to submit request. Please try again.'
  } finally {
    submitting.value = false
  }
}

async function checkApproval() {
  const session = await authClient.getSession()
  const user = session.data?.user as ({ role?: string } & object) | null | undefined
  const role = user?.role
  if (role && role !== 'visitor') {
    await navigateTo(role === 'teacher' ? '/teacher' : '/student', { replace: true })
  } else {
    toast.add({
      title: 'Approval Pending',
      description: 'Your request is still pending. Please wait for an admin to approve your role.',
      color: 'warning',
      icon: 'i-heroicons-clock'
    })
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="text-center max-w-sm w-full">

      <!-- Loading -->
      <template v-if="loading">
        <p class="text-muted">
          Loading...
        </p>
      </template>

      <!-- Pending state -->
      <template v-else-if="pendingRequest">
        <UIcon
          name="i-heroicons-clock"
          class="text-warning w-16 h-16 mx-auto mb-6"
        />
        <h1 class="text-3xl font-bold mb-2">
          Request Submitted
        </h1>
        <p class="text-muted mb-8">
          Your request to become a
          <strong class="capitalize">{{ pendingRequest.requestedRole }}</strong>
          is pending admin approval. You'll get access once an admin reviews your request.
        </p>
        <UButton
          variant="outline"
          @click="checkApproval"
        >
          Check Approval Status
        </UButton>
      </template>

      <!-- Pick role -->
      <template v-else>
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
            :loading="submitting"
            @click="pick('teacher')"
          >
            I'm a Teacher
          </UButton>

          <UButton
            size="xl"
            color="neutral"
            variant="outline"
            class="flex-1"
            :loading="submitting"
            @click="pick('student')"
          >
            I'm a Student
          </UButton>
        </div>
      </template>

    </div>
  </div>
</template>
