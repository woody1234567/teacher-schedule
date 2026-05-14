import { computed, shallowRef } from 'vue'

export interface CalendarEvent {
  id: number
  teacherId?: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  isAvailable: boolean
  maxStudents: number | null
  createdAt: string
  updatedAt: string
}

export interface CalendarEventInput {
  title: string
  description?: string | null
  startTime: string
  endTime: string
  isAvailable?: boolean
  maxStudents?: number
}

interface CalendarEventsResponse {
  events: CalendarEvent[]
}

interface CalendarEventResponse {
  event: CalendarEvent
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) {
    return err.message
  }

  if (typeof err === 'object' && err !== null) {
    const data = 'data' in err ? (err as { data?: { message?: string, statusMessage?: string } }).data : undefined
    return data?.message || data?.statusMessage || fallback
  }

  return fallback
}

function toDateKey(date: Date | string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

export function useCalendar() {
  const events = shallowRef<CalendarEvent[]>([])
  const loading = shallowRef(false)
  const error = shallowRef('')
  const selectedEvent = shallowRef<CalendarEvent | null>(null)

  async function fetchEvents() {
    loading.value = true
    error.value = ''

    try {
      const response = await $fetch<CalendarEventsResponse>('/api/calendar', {
        method: 'GET',
      })
      events.value = response.events
    } catch (err) {
      error.value = getErrorMessage(err, 'Failed to fetch events')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createEvent(data: CalendarEventInput) {
    loading.value = true
    error.value = ''

    try {
      const response = await $fetch<CalendarEventResponse>('/api/calendar', {
        method: 'POST',
        body: data,
      })
      events.value = [...events.value, response.event]
      return response.event
    } catch (err) {
      error.value = getErrorMessage(err, 'Failed to create event')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateEvent(id: number, data: Partial<CalendarEventInput>) {
    loading.value = true
    error.value = ''

    try {
      const response = await $fetch<CalendarEventResponse>(`/api/calendar/${id}`, {
        method: 'PUT',
        body: data,
      })
      events.value = events.value.map(event => event.id === id ? response.event : event)

      if (selectedEvent.value?.id === id) {
        selectedEvent.value = response.event
      }

      return response.event
    } catch (err) {
      error.value = getErrorMessage(err, 'Failed to update event')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteEvent(id: number) {
    loading.value = true
    error.value = ''

    try {
      await $fetch(`/api/calendar/${id}`, {
        method: 'DELETE',
      })
      events.value = events.value.filter(event => event.id !== id)

      if (selectedEvent.value?.id === id) {
        selectedEvent.value = null
      }
    } catch (err) {
      error.value = getErrorMessage(err, 'Failed to delete event')
      throw err
    } finally {
      loading.value = false
    }
  }

  const upcomingEvents = computed(() => {
    const now = new Date()
    return events.value
      .filter(event => new Date(event.startTime) > now)
      .toSorted((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  })

  const availableEvents = computed(() => {
    return events.value.filter(event => event.isAvailable)
  })

  function getEventsByDate(date: Date) {
    const dateKey = toDateKey(date)
    return events.value.filter(event => toDateKey(event.startTime) === dateKey)
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
