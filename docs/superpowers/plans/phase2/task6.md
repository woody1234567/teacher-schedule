## Task 6: 建立教師行事曆頁面

### 檔案：
- Create: `app/pages/teacher/calendar.vue`

- [ ] **Step 1: 建立教師行事曆頁面**

建立 `app/pages/teacher/calendar.vue`：

```vue
<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-7xl mx-auto px-4">
      <h1 class="text-3xl font-bold mb-8">My Calendar</h1>

      <div class="grid grid-cols-3 gap-6">
        <!-- Calendar View -->
        <div class="col-span-2">
          <CalendarView
            :events="calendar.events"
            :show-actions="true"
            @edit="startEdit"
            @delete="deleteEvent"
          />
        </div>

        <!-- Event Form Sidebar -->
        <div class="col-span-1">
          <div class="sticky top-8">
            <div v-if="!editingEvent && !showForm" class="bg-white rounded-lg shadow p-6">
              <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
              <button
                @click="showForm = true"
                class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
              >
                ➕ Add New Event
              </button>

              <h3 class="font-semibold mt-6 mb-3">Upcoming Events</h3>
              <div v-if="calendar.upcomingEvents.length === 0" class="text-gray-500 text-sm">
                No upcoming events
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="event in calendar.upcomingEvents.slice(0, 5)"
                  :key="event.id"
                  class="text-sm p-2 bg-gray-50 rounded"
                >
                  <div class="font-medium">{{ event.title }}</div>
                  <div class="text-xs text-gray-500">
                    {{ formatDate(event.startTime) }} {{ formatTime(event.startTime) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Form for Creating/Editing -->
            <div v-if="showForm || editingEvent" class="bg-white rounded-lg shadow p-6">
              <h2 class="text-lg font-semibold mb-4">
                {{ editingEvent ? 'Edit Event' : 'New Event' }}
              </h2>
              <EventForm
                :event="editingEvent"
                :loading="calendar.loading"
                @submit="saveEvent"
                @cancel="cancelEdit"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCalendar } from '~/composables/useCalendar'
import type { CalendarEvent, CalendarEventInput } from '~/composables/useCalendar'

definePageMeta({
  middleware: 'auth',
})

const calendar = useCalendar()
const showForm = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)

onMounted(async () => {
  await calendar.fetchEvents()
})

const startEdit = (event: CalendarEvent) => {
  editingEvent.value = event
  showForm.value = false
}

const cancelEdit = () => {
  editingEvent.value = null
  showForm.value = false
}

const saveEvent = async (data: CalendarEventInput) => {
  try {
    if (editingEvent.value) {
      await calendar.updateEvent(editingEvent.value.id, data)
    } else {
      await calendar.createEvent(data)
    }
    cancelEdit()
  } catch (err) {
    // Error handled by composable
  }
}

const deleteEvent = async (id: number) => {
  if (confirm('Are you sure you want to delete this event?')) {
    try {
      await calendar.deleteEvent(id)
    } catch (err) {
      // Error handled by composable
    }
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}
</script>
```

- [ ] **Step 2: 提交**

```bash
git add app/pages/teacher/calendar.vue
git commit -m "feat: add teacher calendar management page"
```

