<script setup lang="ts">
definePageMeta({
  title: 'Student Dashboard',
  role: 'student',
})
</script>

<template>
  <UContainer class="py-10">
    <UPageHeader
      title="Student Dashboard"
      description="A protected student route used to verify role-based navigation."
    />

    <UPageSection>
      <UCard>
        <p class="text-muted">
          Student-only content is available here after authentication and role verification.
        </p>
      </UCard>
    </UPageSection>
  </UContainer>
</template>
