<script setup lang="ts">
definePageMeta({
  title: 'Teacher Dashboard',
  role: 'teacher',
})

const actionCards = [
  {
    title: 'Manage Calendar',
    description: 'Create availability, edit teaching events, and keep your schedule current.',
    icon: 'i-lucide-calendar-days',
    to: '/teacher/calendar',
    buttonLabel: 'Open Calendar',
  },
  {
    title: 'View Schedule',
    description: 'Check upcoming teaching blocks and quickly adjust published time slots.',
    icon: 'i-lucide-clock-3',
    to: '/teacher/calendar',
    buttonLabel: 'View Schedule',
  },
]
</script>

<template>
  <UContainer class="py-10">
    <UPageHeader
      title="Teacher Dashboard"
      description="Manage availability and keep your students pointed at current booking times."
    />

    <div class="mt-8 grid gap-4 md:grid-cols-2">
      <UCard
        v-for="card in actionCards"
        :key="card.title"
      >
        <div class="flex h-full flex-col gap-5">
          <div class="flex items-start gap-3">
            <div class="rounded-md bg-elevated p-2 text-primary">
              <UIcon :name="card.icon" class="size-5" />
            </div>

            <div class="min-w-0 space-y-1">
              <h2 class="text-base font-semibold text-highlighted">
                {{ card.title }}
              </h2>
              <p class="text-sm text-muted">
                {{ card.description }}
              </p>
            </div>
          </div>

          <UButton
            :to="card.to"
            :label="card.buttonLabel"
            trailing-icon="i-lucide-arrow-right"
            class="mt-auto w-fit"
          />
        </div>
      </UCard>
    </div>

    <UCard class="mt-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-highlighted">
            Publish availability
          </h2>
          <p class="text-sm text-muted">
            Students can view available slots from their dashboard after you publish them.
          </p>
        </div>

        <UButton
          to="/teacher/calendar"
          color="neutral"
          variant="outline"
          icon="i-lucide-calendar-plus"
          label="Add Time Slot"
        />
      </div>
    </UCard>
  </UContainer>
</template>
