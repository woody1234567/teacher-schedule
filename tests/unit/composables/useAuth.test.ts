import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '~/app/composables/useAuth'
import { authClient } from '~/app/utils/auth-client'

vi.mock('~/app/utils/auth-client', () => ({
  authClient: {
    useSession: vi.fn().mockReturnValue({ data: null, isPending: false, error: null }),
    getSession: vi.fn(),
    signIn: { email: vi.fn(), social: vi.fn() },
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
      vi.mocked(authClient.signIn.email).mockResolvedValue({ data: { user: { role: 'student' } } as any, error: null })

      await auth.login('user@example.com', 'Secret123!')

      expect(authClient.signIn.email).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Secret123!',
      })
    })

    it('navigates to the teacher home on successful teacher login', async () => {
      vi.mocked(authClient.signIn.email).mockResolvedValue({ data: { user: { role: 'teacher' } } as any, error: null })

      await auth.login('user@example.com', 'Secret123!')

      expect(mockNavigateTo).toHaveBeenCalledWith('/teacher')
    })

    it('navigates to the student home on successful student login', async () => {
      vi.mocked(authClient.signIn.email).mockResolvedValue({ data: { user: { role: 'student' } } as any, error: null })

      await auth.login('user@example.com', 'Secret123!')

      expect(mockNavigateTo).toHaveBeenCalledWith('/student')
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
    it('calls signUp.email with the selected role', async () => {
      vi.mocked(authClient.signUp.email).mockResolvedValue({ data: { user: { role: 'teacher' } } as any, error: null })

      await auth.register('user@example.com', 'Secret123!', 'Test User', 'teacher')

      expect(authClient.signUp.email).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Secret123!',
        name: 'Test User',
        role: 'teacher',
      })
    })

    it('defaults registration role to student', async () => {
      vi.mocked(authClient.signUp.email).mockResolvedValue({ data: { user: { role: 'student' } } as any, error: null })

      await auth.register('user@example.com', 'Secret123!', 'Test User')

      expect(authClient.signUp.email).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Secret123!',
        name: 'Test User',
        role: 'student',
      })
    })

    it('navigates to the selected role home on successful registration', async () => {
      vi.mocked(authClient.signUp.email).mockResolvedValue({ data: { user: { role: 'teacher' } } as any, error: null })

      await auth.register('user@example.com', 'Secret123!', 'Test User', 'teacher')

      expect(mockNavigateTo).toHaveBeenCalledWith('/teacher')
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

  // ─── google sign in ───────────────────────────────────────────────────────

  describe('signInWithGoogle', () => {
    it('starts the Google OAuth flow with the default callback URL', async () => {
      vi.mocked(authClient.signIn.social).mockResolvedValue({ data: { url: '/api/auth/sign-in/social' }, error: null } as any)

      await auth.signInWithGoogle()

      expect(authClient.signIn.social).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/',
      })
    })

    it('supports a custom callback URL', async () => {
      vi.mocked(authClient.signIn.social).mockResolvedValue({ data: { url: '/api/auth/sign-in/social' }, error: null } as any)

      await auth.signInWithGoogle('/teacher')

      expect(authClient.signIn.social).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/teacher',
      })
    })

    it('throws with error message when Google sign in fails', async () => {
      vi.mocked(authClient.signIn.social).mockResolvedValue({
        data: null,
        error: { message: 'OAuth provider is not configured' },
      } as any)

      await expect(auth.signInWithGoogle()).rejects.toThrow('OAuth provider is not configured')
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
