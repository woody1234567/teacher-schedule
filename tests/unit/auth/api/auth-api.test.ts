import { describe, it, expect, afterAll } from 'vitest'
import { auth } from '~/server/utils/better-auth'
import { getUserByEmail } from '~/server/db/queries/users'
import { getDatabase } from '~/server/db/index'
import { accounts, sessions, users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

const ts = Date.now()
const testEmail = (tag: string) => `test-${ts}-auth-${tag}@example.com`
const testPassword = 'TestPass123!'

describe('Auth API', { timeout: 30000 }, () => {
  const createdEmails: string[] = []

  afterAll(async () => {
    const db = getDatabase()
    for (const email of createdEmails) {
      const user = await getUserByEmail(email)
      if (user) {
        await db.delete(sessions).where(eq(sessions.userId, user.id))
        await db.delete(accounts).where(eq(accounts.userId, user.id))
        await db.delete(users).where(eq(users.id, user.id))
      }
    }
  })

  // ─── signUpEmail ───────────────────────────────────────────────────────────

  describe('signUpEmail', () => {
    it('should create a user and return user + session', async () => {
      const email = testEmail('signup')
      createdEmails.push(email)

      const result = await auth.api.signUpEmail({
        body: { email, password: testPassword, name: 'Test User' },
      })

      expect(result.user).toBeDefined()
      expect(result.user.email).toBe(email)
      expect(result.user.name).toBe('Test User')
      expect(result.token).toBeDefined()
    })

    it('should store the user in the database', async () => {
      const email = testEmail('signup-db')
      createdEmails.push(email)

      await auth.api.signUpEmail({
        body: { email, password: testPassword, name: 'DB User' },
      })

      const user = await getUserByEmail(email)
      expect(user).toBeDefined()
      expect(user?.email).toBe(email)
      expect(user?.name).toBe('DB User')
    })

    it('should not store plain-text password in users table', async () => {
      const email = testEmail('password-check')
      createdEmails.push(email)

      await auth.api.signUpEmail({
        body: { email, password: testPassword, name: 'Security User' },
      })

      const user = await getUserByEmail(email)
      expect(user?.passwordHash).toBeNull()
    })

    it('should reject duplicate email', async () => {
      const email = testEmail('dup')
      createdEmails.push(email)

      await auth.api.signUpEmail({
        body: { email, password: testPassword, name: 'First' },
      })

      await expect(
        auth.api.signUpEmail({
          body: { email, password: testPassword, name: 'Second' },
        }),
      ).rejects.toThrow()
    })
  })

  // ─── signInEmail ───────────────────────────────────────────────────────────

  describe('signInEmail', () => {
    it('should return user and session token on valid credentials', async () => {
      const email = testEmail('signin')
      createdEmails.push(email)

      await auth.api.signUpEmail({
        body: { email, password: testPassword, name: 'Sign In User' },
      })

      const result = await auth.api.signInEmail({
        body: { email, password: testPassword },
      })

      expect(result.user).toBeDefined()
      expect(result.user.email).toBe(email)
      expect(result.token).toBeDefined()
    })

    it('should create a session record in the database', async () => {
      const email = testEmail('session-check')
      createdEmails.push(email)
      const db = getDatabase()

      await auth.api.signUpEmail({
        body: { email, password: testPassword, name: 'Session User' },
      })

      const user = await getUserByEmail(email)
      const sessionRows = await db.select().from(sessions).where(eq(sessions.userId, user!.id))

      expect(sessionRows.length).toBeGreaterThan(0)
    })

    it('should reject invalid password', async () => {
      const email = testEmail('wrong-pass')
      createdEmails.push(email)

      await auth.api.signUpEmail({
        body: { email, password: testPassword, name: 'Wrong Pass User' },
      })

      await expect(
        auth.api.signInEmail({
          body: { email, password: 'WrongPass999!' },
        }),
      ).rejects.toThrow()
    })

    it('should reject non-existent email', async () => {
      await expect(
        auth.api.signInEmail({
          body: { email: 'nobody@nowhere.invalid', password: testPassword },
        }),
      ).rejects.toThrow()
    })
  })

  // ─── getSession ────────────────────────────────────────────────────────────

  describe('getSession', () => {
    it('should return session data using the session token', async () => {
      const email = testEmail('getsession')
      createdEmails.push(email)

      const { token } = await auth.api.signUpEmail({
        body: { email, password: testPassword, name: 'Session Reader' },
      })

      const session = await auth.api.getSession({
        headers: new Headers({ Authorization: `Bearer ${token}` }),
      })

      expect(session).toBeDefined()
      expect(session?.user.email).toBe(email)
    })

    it('should return null for invalid token', async () => {
      const session = await auth.api.getSession({
        headers: new Headers({ Authorization: 'Bearer invalid-token-12345' }),
      })

      expect(session).toBeNull()
    })
  })

  // ─── signOut ───────────────────────────────────────────────────────────────

  describe('signOut', () => {
    it('should invalidate the session after sign out', async () => {
      const email = testEmail('signout')
      createdEmails.push(email)
      const db = getDatabase()

      const { token } = await auth.api.signUpEmail({
        body: { email, password: testPassword, name: 'Sign Out User' },
      })

      const user = await getUserByEmail(email)
      const beforeSessions = await db.select().from(sessions).where(eq(sessions.userId, user!.id))
      expect(beforeSessions.length).toBeGreaterThan(0)

      await auth.api.signOut({
        headers: new Headers({ Authorization: `Bearer ${token}` }),
      })

      const afterSessions = await db.select().from(sessions).where(eq(sessions.userId, user!.id))
      expect(afterSessions.length).toBe(0)
    })
  })
})
