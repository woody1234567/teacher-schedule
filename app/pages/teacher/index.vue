<script setup lang="ts">
definePageMeta({
  title: 'Teacher Dashboard',
  role: 'teacher',
})
</script>

<template>
  <UContainer class="py-10">
    <UPageHeader
      title="Teacher Dashboard"
      description="A protected teacher route used to verify role-based navigation."
    />

    <UPageSection>
      <UCard>
        <p class="text-muted">
          Teacher-only content is available here after authentication and role verification.
        </p>
      </UCard>
    </UPageSection>
  </UContainer>
</template>
