<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import type { CalendarEvent, CalendarEventInput } from '~/composables/useCalendar'

definePageMeta({
  title: 'My Calendar',
  role: 'teacher',
})

const calendar = useCalendar()
const showForm = shallowRef(false)
const editingEvent = shallowRef<CalendarEvent | null>(null)

const formTitle = computed(() => editingEvent.value ? 'Edit Event' : 'New Event')
const recentUpcomingEvents = computed(() => calendar.upcomingEvents.value.slice(0, 5))

onMounted(async () => {
  await calendar.fetchEvents()
})

function startEdit(event: CalendarEvent) {
  editingEvent.value = event
  showForm.value = false
}

function cancelEdit() {
  editingEvent.value = null
  showForm.value = false
}

async function saveEvent(data: CalendarEventInput) {
  try {
    if (editingEvent.value) {
      await calendar.updateEvent(editingEvent.value.id, data)
    }
    else {
      await calendar.createEvent(data)
    }
    cancelEdit()
  }
  catch {
    // The composable exposes the error for the page alert.
  }
}

async function deleteEvent(id: number) {
  if (!confirm('Are you sure you want to delete this event?')) {
    return
  }

  try {
    await calendar.deleteEvent(id)
  }
  catch {
    // The composable exposes the error for the page alert.
  }
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('zh-TW', {
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
  <UContainer class="py-10">
    <UPageHeader
      title="My Calendar"
      description="Manage available time slots and scheduled teaching events."
    />

    <UAlert
      v-if="calendar.error.value"
      class="mt-6"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :description="calendar.error.value"
    />

    <div class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <CalendarView
        :events="calendar.events.value"
        :show-actions="true"
        @edit="startEdit"
        @delete="deleteEvent"
      />

      <aside class="space-y-4 lg:sticky lg:top-8 lg:self-start">
        <UCard v-if="!editingEvent && !showForm">
          <div class="space-y-6">
            <div class="space-y-3">
              <h2 class="text-base font-semibold text-highlighted">
                Quick Actions
              </h2>
              <UButton
                block
                icon="i-lucide-calendar-plus"
                label="Add New Event"
                @click="showForm = true"
              />
            </div>

            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-highlighted">
                Upcoming Events
              </h3>

              <UAlert
                v-if="recentUpcomingEvents.length === 0"
                color="neutral"
                variant="soft"
                icon="i-lucide-calendar"
                description="No upcoming events"
              />

              <div v-else class="space-y-2">
                <button
                  v-for="event in recentUpcomingEvents"
                  :key="event.id"
                  type="button"
                  class="w-full rounded-md border border-muted px-3 py-2 text-left transition hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  @click="startEdit(event)"
                >
                  <span class="block truncate text-sm font-medium text-highlighted">
                    {{ event.title }}
                  </span>
                  <span class="mt-1 block text-xs text-muted">
                    {{ formatDate(event.startTime) }} {{ formatTime(event.startTime) }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </UCard>

        <div v-else class="space-y-3">
          <h2 class="text-base font-semibold text-highlighted">
            {{ formTitle }}
          </h2>
          <CalendarEventForm
            :event="editingEvent"
            :loading="calendar.loading.value"
            @submit="saveEvent"
            @cancel="cancelEdit"
          />
        </div>
      </aside>
    </div>
  </UContainer>
</template>
