## Task 4: 建立行事曆組合函數

### 檔案：
- Create: `app/composables/useCalendar.ts`

- [ ] **Step 1: 實現行事曆組合函數**

建立 `app/composables/useCalendar.ts`：

```typescript
import { ref, computed } from 'vue'

export interface CalendarEvent {
  id: number
  title: string
  description?: string
  startTime: string
  endTime: string
  isAvailable: boolean
  maxStudents: number
  createdAt: string
  updatedAt: string
}

export interface CalendarEventInput {
  title: string
  description?: string
  startTime: string
  endTime: string
  isAvailable?: boolean
  maxStudents?: number
}

export const useCalendar = () => {
  const events = ref<CalendarEvent[]>([])
  const loading = ref(false)
  const error = ref('')
  const selectedEvent = ref<CalendarEvent | null>(null)

  const fetchEvents = async () => {
    loading.value = true
    error.value = ''

    try {
      const response = await $fetch('/api/calendar', {
        method: 'GET',
      })
      events.value = response.events
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch events'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createEvent = async (data: CalendarEventInput) => {
    loading.value = true
    error.value = ''

    try {
      const response = await $fetch('/api/calendar', {
        method: 'POST',
        body: data,
      })
      events.value.push(response.event)
      return response.event
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to create event'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateEvent = async (id: number, data: Partial<CalendarEventInput>) => {
    loading.value = true
    error.value = ''

    try {
      const response = await $fetch(`/api/calendar/${id}`, {
        method: 'PUT',
        body: data,
      })
      const index = events.value.findIndex(e => e.id === id)
      if (index !== -1) {
        events.value[index] = response.event
      }
      return response.event
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to update event'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteEvent = async (id: number) => {
    loading.value = true
    error.value = ''

    try {
      await $fetch(`/api/calendar/${id}`, {
        method: 'DELETE',
      })
      events.value = events.value.filter(e => e.id !== id)
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to delete event'
      throw err
    } finally {
      loading.value = false
    }
  }

  const upcomingEvents = computed(() => {
    const now = new Date()
    return events.value.filter(e => new Date(e.startTime) > now).sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    })
  })

  const availableEvents = computed(() => {
    return events.value.filter(e => e.isAvailable)
  })

  const getEventsByDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.value.filter(e => e.startTime.startsWith(dateStr))
  }

  return {
    events,
    loading,
    error,
    selectedEvent,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    upcomingEvents,
    availableEvents,
    getEventsByDate,
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/composables/useCalendar.ts
git commit -m "feat: add calendar composable with event management"
```

