import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { getDatabase } from '~/server/db/index'
import { calendarEvents, users } from '~/server/db/schema'
import { createCalendarEvent } from '~/server/db/queries/calendar'
import { createUser } from '~/server/db/queries/users'

interface TestEvent {
  context: {
    params?: Record<string, string>
  }
}

const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
const createdUserIds: string[] = []

function createEvent(params?: Record<string, string>): TestEvent {
  return {
    context: { params },
  }
}

async function createTestUser(role: 'student' | 'teacher') {
  const user = await createUser({
    email: `test-${runId}-available-${role}-${crypto.randomUUID()}@example.com`,
    name: role === 'teacher' ? 'Available Teacher' : 'Student User',
    role,
  })

  createdUserIds.push(user.id)
  return user
}

describe('available calendar slots API', { timeout: 30000 }, () => {
  let availableHandler: (event: TestEvent) => Promise<any>
  let teacher: Awaited<ReturnType<typeof createTestUser>>

  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', (options: { statusCode: number, statusMessage: string }) => {
      const error = new Error(options.statusMessage) as Error & {
        statusCode: number
        statusMessage: string
      }
      error.statusCode = options.statusCode
      error.statusMessage = options.statusMessage
      return error
    })

    availableHandler = (await import('~/server/api/calendar/teachers/[teacherId]/available.get')).default
  })

  beforeEach(async () => {
    teacher = await createTestUser('teacher')

    await createCalendarEvent(teacher.id, {
      title: 'Available Slot 1',
      description: 'Open for booking',
      startTime: new Date('2026-05-01T10:00:00.000Z'),
      endTime: new Date('2026-05-01T11:00:00.000Z'),
      isAvailable: true,
      maxStudents: 5,
    })

    await createCalendarEvent(teacher.id, {
      title: 'Booked Slot',
      description: null,
      startTime: new Date('2026-05-02T10:00:00.000Z'),
      endTime: new Date('2026-05-02T11:00:00.000Z'),
      isAvailable: false,
      maxStudents: 5,
    })
  })

  afterAll(async () => {
    const db = getDatabase()

    for (const userId of createdUserIds.splice(0)) {
      await db.delete(calendarEvents).where(eq(calendarEvents.teacherId, userId))
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  it('gets available slots for a teacher', async () => {
    const response = await availableHandler(createEvent({ teacherId: teacher.id }))

    expect(response.teacher).toMatchObject({
      id: teacher.id,
      name: 'Available Teacher',
      email: teacher.email,
      image: null,
    })
    expect(response.availableSlots).toHaveLength(1)
    expect(response.availableSlots[0]).toMatchObject({
      teacherId: teacher.id,
      title: 'Available Slot 1',
      isAvailable: true,
      maxStudents: 5,
    })
  })

  it('returns 404 for a missing teacher', async () => {
    await expect(availableHandler(createEvent({ teacherId: crypto.randomUUID() })))
      .rejects
      .toMatchObject({ statusCode: 404 })
  })

  it('returns 404 when the user is not a teacher', async () => {
    const student = await createTestUser('student')

    await expect(availableHandler(createEvent({ teacherId: student.id })))
      .rejects
      .toMatchObject({ statusCode: 404 })
  })
})
