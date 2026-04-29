<script setup lang="ts">
definePageMeta({
  auth: false,
  layout: "default",
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-900">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-2xl font-bold text-center">Create account</h1>
      </template>

      <AuthRegisterForm />
    </UCard>
  </div>
</template>
