<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEvent } from '~/app/composables/useCalendar'

const props = withDefaults(defineProps<{
  event: CalendarEvent
  showActions?: boolean
}>(), {
  showActions: false,
})

const emit = defineEmits<{
  (event: 'edit'): void
  (event: 'delete'): void
  (event: 'book'): void
}>()

const availabilityColor = computed(() => props.event.isAvailable ? 'success' : 'error')
const availabilityLabel = computed(() => props.event.isAvailable ? 'Available' : 'Booked')
const maxStudentsLabel = computed(() => {
  const maxStudents = props.event.maxStudents ?? 1
  return `Max ${maxStudents} student${maxStudents > 1 ? 's' : ''}`
})

const accentClass = computed(() => props.event.isAvailable ? 'border-s-success' : 'border-s-error')

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr))
}

function formatTime(dateStr: string) {
  return new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}
</script>

<template>
  <UCard
    :class="['border-s-4', accentClass]"
    :ui="{ body: 'p-4' }"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-start gap-2">
          <h3 class="min-w-0 flex-1 truncate text-base font-semibold text-highlighted">
            {{ event.title }}
          </h3>
          <UBadge :color="availabilityColor" variant="soft">
            {{ availabilityLabel }}
          </UBadge>
        </div>

        <p v-if="event.description" class="mt-1 text-sm text-muted">
          {{ event.description }}
        </p>

        <div class="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
          <span class="inline-flex items-center gap-1.5">
            <UIcon name="i-lucide-calendar-days" class="size-4" />
            {{ formatDate(event.startTime) }}
          </span>
          <span class="inline-flex items-center gap-1.5">
            <UIcon name="i-lucide-clock" class="size-4" />
            {{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}
          </span>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <UBadge color="info" variant="subtle">
            {{ maxStudentsLabel }}
          </UBadge>
        </div>
      </div>

      <div v-if="showActions" class="flex shrink-0 gap-2">
        <UButton
          icon="i-lucide-pencil"
          label="Edit"
          color="neutral"
          variant="outline"
          size="sm"
          @click="emit('edit')"
        />
        <UButton
          icon="i-lucide-trash-2"
          label="Delete"
          color="error"
          variant="soft"
          size="sm"
          @click="emit('delete')"
        />
      </div>

      <UButton
        v-else-if="event.isAvailable"
        icon="i-lucide-calendar-plus"
        label="Book"
        color="primary"
        variant="soft"
        size="sm"
        class="shrink-0 self-start"
        @click="emit('book')"
      />
    </div>
  </UCard>
</template>
