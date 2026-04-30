import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { auth } from '~/server/utils/better-auth'
import { getDatabase } from '~/server/db/index'
import { accounts, calendarEvents, sessions, users } from '~/server/db/schema'
import { getUserByEmail, updateUserRole } from '~/server/db/queries/users'

interface TestEvent {
  body?: unknown
  context: {
    params?: Record<string, string>
  }
  cookies?: Record<string, string>
}

const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
const testPassword = 'TestPassword123!'
const createdUserIds: string[] = []

function createEvent(token?: string, body?: unknown, params?: Record<string, string>): TestEvent {
  return {
    body,
    context: { params },
    cookies: token ? { auth_token: token } : {},
  }
}

async function createTeacher(tag: string) {
  const email = `test-${runId}-calendar-api-${tag}@example.com`
  const result = await auth.api.signUpEmail({
    body: {
      email,
      password: testPassword,
      name: `Calendar API ${tag}`,
    },
  })

  const user = await getUserByEmail(email)
  if (!user) {
    throw new Error('Test user was not created')
  }

  await updateUserRole(user.id, 'teacher')
  createdUserIds.push(user.id)

  return {
    id: user.id,
    email,
    token: result.token,
  }
}

describe('Calendar API', { timeout: 30000 }, () => {
  let getCalendarHandler: (event: TestEvent) => Promise<any>
  let createCalendarHandler: (event: TestEvent) => Promise<any>
  let updateCalendarHandler: (event: TestEvent) => Promise<any>
  let deleteCalendarHandler: (event: TestEvent) => Promise<any>
  let teacher: Awaited<ReturnType<typeof createTeacher>>

  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('readBody', async (event: TestEvent) => event.body)
    vi.stubGlobal('getCookie', (event: TestEvent, name: string) => event.cookies?.[name])
    vi.stubGlobal('createError', (options: { statusCode: number, statusMessage: string, data?: unknown }) => {
      const error = new Error(options.statusMessage) as Error & {
        statusCode: number
        statusMessage: string
        data?: unknown
      }
      error.statusCode = options.statusCode
      error.statusMessage = options.statusMessage
      error.data = options.data
      return error
    })

    getCalendarHandler = (await import('~/server/api/calendar/index.get')).default
    createCalendarHandler = (await import('~/server/api/calendar/index.post')).default
    updateCalendarHandler = (await import('~/server/api/calendar/[id].put')).default
    deleteCalendarHandler = (await import('~/server/api/calendar/[id].delete')).default
  })

  beforeEach(async () => {
    teacher = await createTeacher(crypto.randomUUID())
  })

  afterAll(async () => {
    const db = getDatabase()

    for (const userId of createdUserIds.splice(0)) {
      await db.delete(calendarEvents).where(eq(calendarEvents.teacherId, userId))
      await db.delete(sessions).where(eq(sessions.userId, userId))
      await db.delete(accounts).where(eq(accounts.userId, userId))
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  it('gets all calendar events for authenticated teacher', async () => {
    const response = await getCalendarHandler(createEvent(teacher.token))

    expect(Array.isArray(response.events)).toBe(true)
  })

  it('creates a calendar event', async () => {
    const response = await createCalendarHandler(createEvent(teacher.token, {
      title: 'Math Class',
      description: 'Advanced Calculus',
      startTime: '2026-05-01T10:00:00.000Z',
      endTime: '2026-05-01T11:00:00.000Z',
      isAvailable: true,
      maxStudents: 5,
    }))

    expect(response.event.title).toBe('Math Class')
    expect(response.event.teacherId).toBe(teacher.id)
    expect(response.event.startTime).toEqual(new Date('2026-05-01T10:00:00.000Z'))
  })

  it('rejects unauthenticated calendar creation', async () => {
    await expect(createCalendarHandler(createEvent(undefined, {
      title: 'Math Class',
      startTime: '2026-05-01T10:00:00.000Z',
      endTime: '2026-05-01T11:00:00.000Z',
    }))).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('updates a calendar event', async () => {
    const created = await createCalendarHandler(createEvent(teacher.token, {
      title: 'Math Class',
      startTime: '2026-05-01T10:00:00.000Z',
      endTime: '2026-05-01T11:00:00.000Z',
      isAvailable: true,
      maxStudents: 5,
    }))

    const updated = await updateCalendarHandler(createEvent(teacher.token, {
      title: 'Updated Math Class',
      isAvailable: false,
    }, { id: String(created.event.id) }))

    expect(updated.event.title).toBe('Updated Math Class')
    expect(updated.event.isAvailable).toBe(false)
  })

  it('deletes a calendar event', async () => {
    const created = await createCalendarHandler(createEvent(teacher.token, {
      title: 'Math Class',
      startTime: '2026-05-01T10:00:00.000Z',
      endTime: '2026-05-01T11:00:00.000Z',
      isAvailable: true,
      maxStudents: 5,
    }))

    const response = await deleteCalendarHandler(createEvent(teacher.token, undefined, {
      id: String(created.event.id),
    }))

    expect(response.success).toBe(true)
  })
})
