<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import type { CalendarEvent } from '~/composables/useCalendar'

interface TeacherProfile {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface AvailableSlotsResponse {
  teacher: TeacherProfile
  availableSlots: CalendarEvent[]
}

definePageMeta({
  title: 'Teacher Availability',
  role: 'student',
})

const route = useRoute()
const teacherId = String(route.params.id)
const teacher = shallowRef<TeacherProfile | null>(null)
const availableSlots = shallowRef<CalendarEvent[]>([])
const loading = shallowRef(false)
const error = shallowRef('')

onMounted(async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<AvailableSlotsResponse>(`/api/calendar/teachers/${teacherId}/available`)
    teacher.value = response.teacher
    availableSlots.value = response.availableSlots
  }
  catch (err) {
    if (typeof err === 'object' && err !== null && 'data' in err) {
      const data = (err as { data?: { message?: string, statusMessage?: string } }).data
      error.value = data?.message || data?.statusMessage || 'Failed to load teacher information'
    }
    else {
      error.value = 'Failed to load teacher information'
    }
  }
  finally {
    loading.value = false
  }
})

function bookSlot(slot: CalendarEvent) {
  alert(`Booking for ${slot.title} - Feature coming in Phase 3`)
}
</script>

<template>
  <UContainer class="py-10">
    <UButton
      to="/student/teachers"
      icon="i-lucide-arrow-left"
      label="Back to Teachers"
      color="neutral"
      variant="ghost"
      class="mb-6"
    />

    <div v-if="loading" class="py-16">
      <UCard>
        <div class="flex items-center justify-center gap-3 text-muted">
          <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
          <span>Loading teacher information...</span>
        </div>
      </UCard>
    </div>

    <div v-else-if="teacher" class="space-y-8">
      <UPageHeader
        :title="teacher.name || 'Teacher'"
        :description="teacher.email"
      />

      <section class="space-y-4">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-highlighted">
              Available Time Slots
            </h2>
            <p class="text-sm text-muted">
              Choose a published slot to request a booking.
            </p>
          </div>
          <UBadge color="success" variant="soft">
            {{ availableSlots.length }} available
          </UBadge>
        </div>

        <UAlert
          v-if="availableSlots.length === 0"
          color="neutral"
          variant="soft"
          icon="i-lucide-calendar-x"
          description="This teacher currently has no available time slots for booking."
        />

        <div v-else class="grid gap-4">
          <EventCard
            v-for="slot in availableSlots"
            :key="slot.id"
            :event="slot"
            :show-actions="false"
            @book="bookSlot(slot)"
          />
        </div>
      </section>
    </div>

    <UAlert
      v-else
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :title="error ? 'Unable to load teacher' : 'Teacher not found'"
      :description="error || 'Teacher not found'"
    />
  </UContainer>
</template>
