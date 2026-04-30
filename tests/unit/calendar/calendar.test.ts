import { eq } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getAvailableSlots,
  getAvailableSlotsInDateRange,
  getCalendarEventById,
  getCalendarEventsByTeacher,
  getCalendarEventsByTeacherAndDate,
  updateCalendarEvent,
} from '@/server/db/queries/calendar'
import { getDatabase } from '@/server/db'
import { calendarEvents } from '@/server/db/schema'
import { createUser, deleteUser } from '@/server/db/queries/users'

const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
const eventData = {
  title: 'Math Class',
  description: 'Advanced Calculus',
  startTime: new Date('2026-05-01T10:00:00'),
  endTime: new Date('2026-05-01T11:00:00'),
  isAvailable: true,
  maxStudents: 5,
}

describe('Calendar Queries', { timeout: 15000 }, () => {
  let teacherId: string
  const createdEventIds: number[] = []
  const createdTeacherIds: string[] = []
  let testIndex = 0

  beforeEach(async () => {
    testIndex += 1
    const teacher = await createUser({
      email: `teacher-calendar-${runId}-${testIndex}@example.com`,
      name: 'Calendar Teacher',
      passwordHash: 'hash123',
      role: 'teacher',
    })

    teacherId = teacher.id
    createdTeacherIds.push(teacher.id)
  })

  afterAll(async () => {
    const db = getDatabase()

    if (createdEventIds.length > 0) {
      await Promise.all(
        createdEventIds.map(id =>
          db.delete(calendarEvents).where(eq(calendarEvents.id, id)).catch(() => {}),
        ),
      )
    }

    await Promise.all(createdTeacherIds.map(id => deleteUser(id).catch(() => {})))
  })

  it('should create a calendar event', async () => {
    const event = await createCalendarEvent(teacherId, eventData)
    createdEventIds.push(event.id)

    expect(event).toBeDefined()
    expect(event.title).toBe(eventData.title)
    expect(event.teacherId).toBe(teacherId)
    expect(event.isAvailable).toBe(true)
  })

  it('should get calendar event by id', async () => {
    const created = await createCalendarEvent(teacherId, eventData)
    createdEventIds.push(created.id)

    const event = await getCalendarEventById(created.id)

    expect(event).toBeDefined()
    expect(event?.id).toBe(created.id)
  })

  it('should get all events for a teacher', async () => {
    const first = await createCalendarEvent(teacherId, eventData)
    const second = await createCalendarEvent(teacherId, {
      ...eventData,
      title: 'Physics Class',
      startTime: new Date('2026-05-02T10:00:00'),
      endTime: new Date('2026-05-02T11:00:00'),
    })
    createdEventIds.push(first.id, second.id)

    const events = await getCalendarEventsByTeacher(teacherId)

    expect(events).toHaveLength(2)
  })

  it('should get events for a teacher on a specific date', async () => {
    const first = await createCalendarEvent(teacherId, eventData)
    const second = await createCalendarEvent(teacherId, {
      ...eventData,
      title: 'Physics Class',
      startTime: new Date('2026-05-02T10:00:00'),
      endTime: new Date('2026-05-02T11:00:00'),
    })
    createdEventIds.push(first.id, second.id)

    const events = await getCalendarEventsByTeacherAndDate(
      teacherId,
      new Date('2026-05-01T00:00:00'),
    )

    expect(events).toHaveLength(1)
    expect(events[0]?.title).toBe('Math Class')
  })

  it('should update calendar event', async () => {
    const created = await createCalendarEvent(teacherId, eventData)
    createdEventIds.push(created.id)

    const updated = await updateCalendarEvent(created.id, {
      title: 'Updated Math Class',
      isAvailable: false,
    })

    expect(updated?.title).toBe('Updated Math Class')
    expect(updated?.isAvailable).toBe(false)
  })

  it('should delete calendar event', async () => {
    const created = await createCalendarEvent(teacherId, eventData)

    const deleted = await deleteCalendarEvent(created.id)
    const event = await getCalendarEventById(created.id)

    expect(deleted).toBe(true)
    expect(event).toBeNull()
  })

  it('should get available slots for a teacher', async () => {
    const first = await createCalendarEvent(teacherId, eventData)
    const second = await createCalendarEvent(teacherId, {
      ...eventData,
      title: 'Physics Class',
      startTime: new Date('2026-05-02T10:00:00'),
      endTime: new Date('2026-05-02T11:00:00'),
      isAvailable: false,
    })
    createdEventIds.push(first.id, second.id)

    const available = await getAvailableSlots(teacherId)

    expect(available).toHaveLength(1)
    expect(available[0]?.title).toBe('Math Class')
  })

  it('should get available slots in a date range', async () => {
    const first = await createCalendarEvent(teacherId, eventData)
    const second = await createCalendarEvent(teacherId, {
      ...eventData,
      title: 'Physics Class',
      startTime: new Date('2026-05-03T10:00:00'),
      endTime: new Date('2026-05-03T11:00:00'),
    })
    createdEventIds.push(first.id, second.id)

    const available = await getAvailableSlotsInDateRange(
      teacherId,
      new Date('2026-05-01T00:00:00'),
      new Date('2026-05-02T00:00:00'),
    )

    expect(available).toHaveLength(1)
    expect(available[0]?.title).toBe('Math Class')
  })
})
