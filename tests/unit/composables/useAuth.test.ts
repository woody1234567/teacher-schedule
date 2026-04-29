import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '~/app/composables/useAuth'
import { authClient } from '~/app/utils/auth-client'

vi.mock('~/app/utils/auth-client', () => ({
  authClient: {
    useSession: vi.fn().mockReturnValue({ data: null, isPending: false, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}))

const mockNavigateTo = vi.fn().mockResolvedValue(undefined)
vi.stubGlobal('navigateTo', mockNavigateTo)

describe('useAuth', () => {
  let auth: ReturnType<typeof useAuth>

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigateTo.mockResolvedValue(undefined)
    auth = useAuth()
  })

  // ─── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('calls signIn.email with correct credentials', async () => {
      vi.mocked(authClient.signIn.email).mockResolvedValue({ data: { user: {} } as any, error: null })

      await auth.login('user@example.com', 'Secret123!')

      expect(authClient.signIn.email).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Secret123!',
      })
    })

    it('navigates to / on successful login', async () => {
      vi.mocked(authClient.signIn.email).mockResolvedValue({ data: { user: {} } as any, error: null })

      await auth.login('user@example.com', 'Secret123!')

      expect(mockNavigateTo).toHaveBeenCalledWith('/')
    })

    it('throws with error message when sign in fails', async () => {
      vi.mocked(authClient.signIn.email).mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' } as any,
      })

      await expect(auth.login('user@example.com', 'wrong')).rejects.toThrow('Invalid credentials')
    })

    it('does not navigate when sign in fails', async () => {
      vi.mocked(authClient.signIn.email).mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' } as any,
      })

      await auth.login('user@example.com', 'wrong').catch(() => {})

      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })

  // ─── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    it('calls signUp.email with correct credentials', async () => {
      vi.mocked(authClient.signUp.email).mockResolvedValue({ data: { user: {} } as any, error: null })

      await auth.register('user@example.com', 'Secret123!', 'Test User')

      expect(authClient.signUp.email).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Secret123!',
        name: 'Test User',
      })
    })

    it('navigates to / on successful registration', async () => {
      vi.mocked(authClient.signUp.email).mockResolvedValue({ data: { user: {} } as any, error: null })

      await auth.register('user@example.com', 'Secret123!', 'Test User')

      expect(mockNavigateTo).toHaveBeenCalledWith('/')
    })

    it('throws with error message when sign up fails', async () => {
      vi.mocked(authClient.signUp.email).mockResolvedValue({
        data: null,
        error: { message: 'Email already in use' } as any,
      })

      await expect(auth.register('user@example.com', 'pass', 'User')).rejects.toThrow('Email already in use')
    })

    it('does not navigate when sign up fails', async () => {
      vi.mocked(authClient.signUp.email).mockResolvedValue({
        data: null,
        error: { message: 'Email already in use' } as any,
      })

      await auth.register('user@example.com', 'pass', 'User').catch(() => {})

      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })

  // ─── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('calls signOut', async () => {
      vi.mocked(authClient.signOut).mockResolvedValue({ data: null, error: null } as any)

      await auth.logout()

      expect(authClient.signOut).toHaveBeenCalled()
    })

    it('navigates to /auth/login after sign out', async () => {
      vi.mocked(authClient.signOut).mockResolvedValue({ data: null, error: null } as any)

      await auth.logout()

      expect(mockNavigateTo).toHaveBeenCalledWith('/auth/login')
    })

    it('throws with error message when sign out fails', async () => {
      vi.mocked(authClient.signOut).mockResolvedValue({
        data: null,
        error: { message: 'Sign out failed' } as any,
      })

      await expect(auth.logout()).rejects.toThrow('Sign out failed')
    })
  })

  // ─── session ───────────────────────────────────────────────────────────────

  describe('session', () => {
    it('exposes session from authClient.useSession', () => {
      const mockSession = { data: { user: { email: 'a@b.com' } }, isPending: false, error: null }
      vi.mocked(authClient.useSession).mockReturnValue(mockSession as any)

      const freshAuth = useAuth()

      expect(freshAuth.session).toBe(mockSession)
    })
  })
})
