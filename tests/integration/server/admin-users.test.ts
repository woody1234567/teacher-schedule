import { afterEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { createUser, getUserById, updateUserRole } from '~/server/db/queries/users'
import { getDatabase } from '~/server/db/index'
import { users } from '~/server/db/schema'
import { updateUserRoleForAdmin } from '~/server/services/admin-users'

const ts = Date.now()
const createdUserIds: string[] = []

async function createTestUser(emailTag: string, role: 'student' | 'teacher' | 'admin' = 'student') {
  const user = await createUser({
    email: `test-${ts}-admin-${emailTag}@example.com`,
    name: `Admin Test ${emailTag}`,
    role,
    emailVerified: true,
  })

  createdUserIds.push(user.id)
  return user
}

describe('admin users integration', { timeout: 30000 }, () => {
  afterEach(async () => {
    const db = getDatabase()

    for (const id of createdUserIds.splice(0)) {
      await db.delete(users).where(eq(users.id, id))
    }
  })

  it('persists a direct user role update to the database', async () => {
    const target = await createTestUser('direct-update')

    const updated = await updateUserRole(target.id, 'teacher')
    const stored = await getUserById(target.id)

    expect(updated?.role).toBe('teacher')
    expect(stored?.role).toBe('teacher')
  })

  it('persists an admin role update to the target user', async () => {
    const admin = await createTestUser('admin', 'admin')
    const target = await createTestUser('target')

    const updated = await updateUserRoleForAdmin(
      { user: { id: admin.id, role: 'admin' } },
      target.id,
      'teacher',
    )
    const stored = await getUserById(target.id)

    expect(updated.role).toBe('teacher')
    expect(stored?.role).toBe('teacher')
  })
})
