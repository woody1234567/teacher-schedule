import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createUser, getUserByEmail, getUserById, updateUser, deleteUser } from '~/server/db/queries/users'

describe('User Database Queries', { timeout: 15000 }, () => {
  const testEmail = `test-${Date.now()}@example.com`
  let createdUserId: string

  afterAll(async () => {
    if (createdUserId) {
      await deleteUser(createdUserId).catch(() => {})
    }
  })

  describe('createUser', () => {
    it('should create a user and return user object with id', async () => {
      const user = await createUser({
        name: 'Test User',
        email: testEmail,
        passwordHash: 'hashed_password_value',
      })

      expect(user).toBeDefined()
      expect(user.id).toBeDefined()
      expect(typeof user.id).toBe('string')
      expect(user.email).toBe(testEmail)
      expect(user.name).toBe('Test User')
      expect(user.createdAt).toBeInstanceOf(Date)

      createdUserId = user.id
    })

    it('should throw error when creating user with duplicate email', async () => {
      await expect(
        createUser({ email: testEmail })
      ).rejects.toThrow()
    })
  })

  describe('getUserByEmail', () => {
    it('should find existing user by email', async () => {
      const user = await getUserByEmail(testEmail)

      expect(user).toBeDefined()
      expect(user?.id).toBe(createdUserId)
      expect(user?.email).toBe(testEmail)
    })

    it('should return undefined for non-existent email', async () => {
      const user = await getUserByEmail('nonexistent@example.com')

      expect(user).toBeUndefined()
    })
  })

  describe('getUserById', () => {
    it('should find existing user by id', async () => {
      const user = await getUserById(createdUserId)

      expect(user).toBeDefined()
      expect(user?.id).toBe(createdUserId)
      expect(user?.email).toBe(testEmail)
    })

    it('should return undefined for non-existent id', async () => {
      const user = await getUserById('00000000-0000-0000-0000-000000000000')

      expect(user).toBeUndefined()
    })
  })

  describe('updateUser', () => {
    it('should update user name and return updated user', async () => {
      const updated = await updateUser(createdUserId, { name: 'Updated Name' })

      expect(updated).toBeDefined()
      expect(updated?.id).toBe(createdUserId)
      expect(updated?.name).toBe('Updated Name')
    })

    it('should update updatedAt timestamp', async () => {
      const before = await getUserById(createdUserId)
      await new Promise(resolve => setTimeout(resolve, 10))
      const updated = await updateUser(createdUserId, { name: 'Another Name' })

      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(before!.updatedAt.getTime())
    })

    it('should return undefined for non-existent id', async () => {
      const result = await updateUser('00000000-0000-0000-0000-000000000000', { name: 'Test' })

      expect(result).toBeUndefined()
    })
  })

  describe('deleteUser', () => {
    it('should delete existing user and return true', async () => {
      const result = await deleteUser(createdUserId)

      expect(result).toBe(true)
    })

    it('should return false when deleting non-existent user', async () => {
      const result = await deleteUser('00000000-0000-0000-0000-000000000000')

      expect(result).toBe(false)
    })

    it('should no longer find deleted user', async () => {
      const user = await getUserById(createdUserId)

      expect(user).toBeUndefined()
    })
  })
})
