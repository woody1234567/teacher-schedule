<script setup lang="ts">
import { shallowRef } from 'vue'

const emit = defineEmits<{
  error: [message: string]
}>()

const { signInWithGoogle } = useAuth()
const loading = shallowRef(false)

async function handleClick() {
  emit('error', '')
  loading.value = true

  try {
    await signInWithGoogle()
  } catch (error) {
    emit('error', error instanceof Error ? error.message : 'Google sign-in failed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UButton
    type="button"
    color="neutral"
    variant="outline"
    block
    icon="i-lucide-chrome"
    :loading="loading"
    @click="handleClick"
  >
    Continue with Google
  </UButton>
</template>
