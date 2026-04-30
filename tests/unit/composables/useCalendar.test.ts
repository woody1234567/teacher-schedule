import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCalendar } from '~/app/composables/useCalendar'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

const pastEvent = {
  id: 1,
  title: 'Past Class',
  description: 'Already done',
  startTime: '2026-01-01T09:00:00.000Z',
  endTime: '2026-01-01T10:00:00.000Z',
  isAvailable: false,
  maxStudents: 1,
  createdAt: '2026-01-01T08:00:00.000Z',
  updatedAt: '2026-01-01T08:00:00.000Z',
}

const futureEvent = {
  id: 2,
  title: 'Future Class',
  description: null,
  startTime: '2026-05-01T10:00:00.000Z',
  endTime: '2026-05-01T11:00:00.000Z',
  isAvailable: true,
  maxStudents: 5,
  createdAt: '2026-04-01T08:00:00.000Z',
  updatedAt: '2026-04-01T08:00:00.000Z',
}

describe('useCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('fetches calendar events from the API', async () => {
    mockFetch.mockResolvedValueOnce({ events: [futureEvent] })

    const calendar = useCalendar()
    await calendar.fetchEvents()

    expect(mockFetch).toHaveBeenCalledWith('/api/calendar', { method: 'GET' })
    expect(calendar.events.value).toEqual([futureEvent])
    expect(calendar.loading.value).toBe(false)
    expect(calendar.error.value).toBe('')
  })

  it('creates an event and appends it locally', async () => {
    const input = {
      title: 'New Class',
      startTime: '2026-05-02T10:00:00.000Z',
      endTime: '2026-05-02T11:00:00.000Z',
      isAvailable: true,
      maxStudents: 3,
    }
    const created = { ...futureEvent, id: 3, ...input }
    mockFetch.mockResolvedValueOnce({ event: created })

    const calendar = useCalendar()
    const result = await calendar.createEvent(input)

    expect(mockFetch).toHaveBeenCalledWith('/api/calendar', {
      method: 'POST',
      body: input,
    })
    expect(result).toEqual(created)
    expect(calendar.events.value).toEqual([created])
  })

  it('updates an existing event locally', async () => {
    const updated = { ...futureEvent, title: 'Updated Class', isAvailable: false }
    mockFetch.mockResolvedValueOnce({ event: updated })

    const calendar = useCalendar()
    calendar.events.value = [futureEvent]
    const result = await calendar.updateEvent(futureEvent.id, {
      title: 'Updated Class',
      isAvailable: false,
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/calendar/2', {
      method: 'PUT',
      body: { title: 'Updated Class', isAvailable: false },
    })
    expect(result).toEqual(updated)
    expect(calendar.events.value).toEqual([updated])
  })

  it('deletes an event locally after API deletion succeeds', async () => {
    mockFetch.mockResolvedValueOnce({ success: true })

    const calendar = useCalendar()
    calendar.events.value = [pastEvent, futureEvent]
    await calendar.deleteEvent(pastEvent.id)

    expect(mockFetch).toHaveBeenCalledWith('/api/calendar/1', { method: 'DELETE' })
    expect(calendar.events.value).toEqual([futureEvent])
  })

  it('derives upcoming, available, and date-filtered events', () => {
    vi.setSystemTime(new Date('2026-04-30T00:00:00.000Z'))

    const calendar = useCalendar()
    calendar.events.value = [futureEvent, pastEvent]

    expect(calendar.upcomingEvents.value).toEqual([futureEvent])
    expect(calendar.availableEvents.value).toEqual([futureEvent])
    expect(calendar.getEventsByDate(new Date('2026-05-01T15:00:00.000Z'))).toEqual([futureEvent])
  })

  it('stores API error messages and rethrows failures', async () => {
    mockFetch.mockRejectedValueOnce({
      data: { message: 'Only teachers can access this endpoint' },
    })

    const calendar = useCalendar()

    await expect(calendar.fetchEvents()).rejects.toMatchObject({
      data: { message: 'Only teachers can access this endpoint' },
    })
    expect(calendar.error.value).toBe('Only teachers can access this endpoint')
    expect(calendar.loading.value).toBe(false)
  })
})
