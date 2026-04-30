import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { getDatabase } from '~/server/db/index'
import { users } from '~/server/db/schema'
import { createUser } from '~/server/db/queries/users'

const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
const createdUserIds: string[] = []

async function createTestUser(role: 'student' | 'teacher') {
  const user = await createUser({
    email: `test-${runId}-teachers-${role}-${crypto.randomUUID()}@example.com`,
    name: role === 'teacher' ? 'Public Teacher' : 'Private Student',
    role,
  })

  createdUserIds.push(user.id)
  return user
}

describe('teachers API', { timeout: 30000 }, () => {
  let teachersHandler: () => Promise<any>

  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    teachersHandler = (await import('~/server/api/teachers/index.get')).default
  })

  afterAll(async () => {
    const db = getDatabase()

    for (const userId of createdUserIds.splice(0)) {
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  it('returns only teachers with public profile fields', async () => {
    const teacher = await createTestUser('teacher')
    const student = await createTestUser('student')

    const response = await teachersHandler()

    expect(response).toContainEqual(expect.objectContaining({
      id: teacher.id,
      name: 'Public Teacher',
      email: teacher.email,
      image: null,
      role: 'teacher',
    }))
    expect(response.some((user: { id: string }) => user.id === student.id)).toBe(false)
    expect(response.find((user: { id: string }) => user.id === teacher.id)).not.toHaveProperty('passwordHash')
  })
})
