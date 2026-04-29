import { describe, it, expect, afterAll } from 'vitest'
import { createUser, getUserByEmail, getUserById, updateUser, deleteUser } from '@/server/db/queries/users'

const ts = Date.now()
const email = (tag: string) => `test-${ts}-${tag}@example.com`

describe('User Database Queries', { timeout: 15000 }, () => {
  // Track all created users for cleanup
  const createdIds: string[] = []

  afterAll(async () => {
    await Promise.all(createdIds.map(id => deleteUser(id).catch(() => {})))
  })

  // ─── createUser ────────────────────────────────────────────────────────────

  describe('createUser', () => {
    it('should create a user and return user object with id', async () => {
      const user = await createUser({
        name: 'Test User',
        email: email('basic'),
        passwordHash: 'hashed_password_value',
      })

      expect(user.id).toBeDefined()
      expect(typeof user.id).toBe('string')
      expect(user.email).toBe(email('basic'))
      expect(user.name).toBe('Test User')
      expect(user.createdAt).toBeInstanceOf(Date)

      createdIds.push(user.id)
    })

    it('should allow creating user with email only (no optional fields)', async () => {
      const user = await createUser({ email: email('minimal') })

      expect(user.id).toBeDefined()
      expect(user.email).toBe(email('minimal'))
      expect(user.name).toBeNull()
      expect(user.passwordHash).toBeNull()
      expect(user.emailVerified).toBe(false)

      createdIds.push(user.id)
    })

    it('should create user with all optional fields and store them correctly', async () => {
      const user = await createUser({
        email: email('full'),
        name: 'Full User',
        passwordHash: 'argon2hash',
        emailVerified: true,
        image: 'https://example.com/avatar.png',
      })

      expect(user.name).toBe('Full User')
      expect(user.passwordHash).toBe('argon2hash')
      expect(user.emailVerified).toBe(true)
      expect(user.image).toBe('https://example.com/avatar.png')

      createdIds.push(user.id)
    })

    it('should create user with emailVerified set to true', async () => {
      const user = await createUser({
        email: email('verified'),
        emailVerified: true,
      })

      expect(user.emailVerified).toBe(true)

      createdIds.push(user.id)
    })

    it('should handle Unicode characters in name', async () => {
      const unicodeName = 'María 老師 Ångström'
      const user = await createUser({
        email: email('unicode'),
        name: unicodeName,
      })

      expect(user.name).toBe(unicodeName)

      createdIds.push(user.id)
    })

    it('should generate unique ids for different users', async () => {
      const a = await createUser({ email: email('id-a') })
      const b = await createUser({ email: email('id-b') })

      expect(a.id).not.toBe(b.id)

      createdIds.push(a.id, b.id)
    })

    it('should throw error when creating user with duplicate email', async () => {
      const dupEmail = email('dup')
      const first = await createUser({ email: dupEmail })
      createdIds.push(first.id)

      await expect(createUser({ email: dupEmail })).rejects.toThrow()
    })
  })

  // ─── getUserByEmail ─────────────────────────────────────────────────────────

  describe('getUserByEmail', () => {
    let userId: string

    afterAll(async () => {
      if (userId) await deleteUser(userId).catch(() => {})
    })

    it('should find existing user by email', async () => {
      const created = await createUser({ email: email('lookup'), name: 'Lookup User' })
      userId = created.id

      const user = await getUserByEmail(email('lookup'))

      expect(user).toBeDefined()
      expect(user?.id).toBe(userId)
      expect(user?.email).toBe(email('lookup'))
      expect(user?.name).toBe('Lookup User')
    })

    it('should return undefined for non-existent email', async () => {
      const user = await getUserByEmail('nobody@nowhere.invalid')

      expect(user).toBeUndefined()
    })

    it('should be case-sensitive (uppercase query does not match lowercase email)', async () => {
      const user = await getUserByEmail(email('lookup').toUpperCase())

      expect(user).toBeUndefined()
    })

    it('should not match email with trailing whitespace', async () => {
      const user = await getUserByEmail(` ${email('lookup')} `)

      expect(user).toBeUndefined()
    })
  })

  // ─── getUserById ───────────────────────────────────────────────────────────

  describe('getUserById', () => {
    let userId: string

    afterAll(async () => {
      if (userId) await deleteUser(userId).catch(() => {})
    })

    it('should find existing user by id', async () => {
      const created = await createUser({ email: email('byid') })
      userId = created.id

      const user = await getUserById(userId)

      expect(user).toBeDefined()
      expect(user?.id).toBe(userId)
      expect(user?.email).toBe(email('byid'))
    })

    it('should return undefined for non-existent id', async () => {
      const user = await getUserById('00000000-0000-0000-0000-000000000000')

      expect(user).toBeUndefined()
    })

    it('should return undefined for empty string id', async () => {
      const user = await getUserById('')

      expect(user).toBeUndefined()
    })
  })

  // ─── updateUser ─────────────────────────────────────────────────────────────

  describe('updateUser', () => {
    let userId: string

    afterAll(async () => {
      if (userId) await deleteUser(userId).catch(() => {})
    })

    it('should update a single field and return updated user', async () => {
      const created = await createUser({ email: email('upd'), name: 'Original' })
      userId = created.id

      const updated = await updateUser(userId, { name: 'Updated' })

      expect(updated?.name).toBe('Updated')
      expect(updated?.email).toBe(email('upd'))
    })

    it('should update multiple fields simultaneously', async () => {
      const updated = await updateUser(userId, {
        name: 'Multi Updated',
        emailVerified: true,
        passwordHash: 'newhash',
      })

      expect(updated?.name).toBe('Multi Updated')
      expect(updated?.emailVerified).toBe(true)
      expect(updated?.passwordHash).toBe('newhash')
    })

    it('should update emailVerified from false to true', async () => {
      const created = await createUser({ email: email('upd-ev') })
      createdIds.push(created.id)

      expect(created.emailVerified).toBe(false)

      const updated = await updateUser(created.id, { emailVerified: true })

      expect(updated?.emailVerified).toBe(true)
    })

    it('should not change createdAt when updating', async () => {
      const before = await getUserById(userId)
      const updated = await updateUser(userId, { name: 'No-timestamp-change' })

      expect(updated?.createdAt.getTime()).toBe(before!.createdAt.getTime())
    })

    it('should update updatedAt timestamp', async () => {
      const before = await getUserById(userId)
      await new Promise(resolve => setTimeout(resolve, 10))
      const updated = await updateUser(userId, { name: 'Bump timestamp' })

      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(before!.updatedAt.getTime())
    })

    it('should return undefined for non-existent id', async () => {
      const result = await updateUser('00000000-0000-0000-0000-000000000000', { name: 'Ghost' })

      expect(result).toBeUndefined()
    })
  })

  // ─── deleteUser ─────────────────────────────────────────────────────────────

  describe('deleteUser', () => {
    it('should delete existing user and return true', async () => {
      const created = await createUser({ email: email('del') })

      const result = await deleteUser(created.id)

      expect(result).toBe(true)
    })

    it('should return false when deleting non-existent user', async () => {
      const result = await deleteUser('00000000-0000-0000-0000-000000000000')

      expect(result).toBe(false)
    })

    it('should return false on second delete of the same user', async () => {
      const created = await createUser({ email: email('del2') })

      await deleteUser(created.id)
      const second = await deleteUser(created.id)

      expect(second).toBe(false)
    })

    it('should no longer find deleted user', async () => {
      const created = await createUser({ email: email('del3') })
      await deleteUser(created.id)

      const found = await getUserById(created.id)

      expect(found).toBeUndefined()
    })
  })

  // ─── Multi-user isolation ───────────────────────────────────────────────────

  describe('Multi-user isolation', () => {
    let userAId: string
    let userBId: string

    afterAll(async () => {
      await Promise.all([
        deleteUser(userAId).catch(() => {}),
        deleteUser(userBId).catch(() => {}),
      ])
    })

    it('should create two distinct users without conflict', async () => {
      const a = await createUser({ email: email('iso-a'), name: 'Alice' })
      const b = await createUser({ email: email('iso-b'), name: 'Bob' })

      userAId = a.id
      userBId = b.id

      expect(a.id).not.toBe(b.id)
      expect(a.email).not.toBe(b.email)
    })

    it('getUserByEmail should return the correct user for each email', async () => {
      const a = await getUserByEmail(email('iso-a'))
      const b = await getUserByEmail(email('iso-b'))

      expect(a?.name).toBe('Alice')
      expect(b?.name).toBe('Bob')
      expect(a?.id).not.toBe(b?.id)
    })

    it('getUserById should return the correct user for each id', async () => {
      const a = await getUserById(userAId)
      const b = await getUserById(userBId)

      expect(a?.email).toBe(email('iso-a'))
      expect(b?.email).toBe(email('iso-b'))
    })

    it('deleting one user should not affect the other', async () => {
      await deleteUser(userAId)

      const a = await getUserById(userAId)
      const b = await getUserById(userBId)

      expect(a).toBeUndefined()
      expect(b).toBeDefined()
    })

    it('updating one user should not change the other', async () => {
      await updateUser(userBId, { name: 'Bob Updated' })

      const b = await getUserById(userBId)

      expect(b?.name).toBe('Bob Updated')
    })
  })
})
