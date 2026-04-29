import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authMiddlewareHandler } from '~/app/middleware/auth.global'
import { authClient } from '~/app/utils/auth-client'

vi.mock('~/app/utils/auth-client', () => ({
  authClient: {
    getSession: vi.fn(),
  },
}))

const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)

type RouteMeta = {
  auth?: false
  role?: 'student' | 'teacher' | Array<'student' | 'teacher'>
}
const makeRoute = (path: string, meta: RouteMeta = {}) =>
  ({ path, meta }) as any

describe('auth global middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('public routes (auth: false)', () => {
    it('allows unauthenticated user through', async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({ data: null, error: null })

      const result = await authMiddlewareHandler(makeRoute('/auth/login', { auth: false }))

      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('redirects authenticated teacher away from /auth/* to teacher home', async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({
        data: { user: { id: '1', email: 'a@b.com', role: 'teacher' } } as any,
        error: null,
      })

      await authMiddlewareHandler(makeRoute('/auth/login', { auth: false }))

      expect(mockNavigateTo).toHaveBeenCalledWith('/teacher', { replace: true })
    })

    it('does not redirect authenticated user on non-/auth public route', async () => {
      const result = await authMiddlewareHandler(makeRoute('/', { auth: false }))

      expect(result).toBeUndefined()
      expect(authClient.getSession).not.toHaveBeenCalled()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })

  describe('protected routes (default)', () => {
    it('redirects unauthenticated user to login', async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({ data: null, error: null })

      await authMiddlewareHandler(makeRoute('/dashboard'))

      expect(mockNavigateTo).toHaveBeenCalledWith('/auth/login', { replace: true })
    })

    it('redirects to login when session lookup fails', async () => {
      vi.mocked(authClient.getSession).mockRejectedValue(new Error('Network error'))

      await authMiddlewareHandler(makeRoute('/dashboard'))

      expect(mockNavigateTo).toHaveBeenCalledWith('/auth/login', { replace: true })
    })

    it('allows authenticated user through', async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({
        data: { user: { id: '1', email: 'a@b.com' } } as any,
        error: null,
      })

      const result = await authMiddlewareHandler(makeRoute('/dashboard'))

      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('allows authenticated user on nested protected route without a role requirement', async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({
        data: { user: { id: '1', email: 'a@b.com' } } as any,
        error: null,
      })

      const result = await authMiddlewareHandler(makeRoute('/dashboard/settings'))

      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })

  describe('role-protected routes', () => {
    it('allows a teacher through teacher routes', async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({
        data: { user: { id: '1', email: 'teacher@example.com', role: 'teacher' } } as any,
        error: null,
      })

      const result = await authMiddlewareHandler(makeRoute('/teacher', { role: 'teacher' }))

      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('allows a student through student routes', async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({
        data: { user: { id: '1', email: 'student@example.com', role: 'student' } } as any,
        error: null,
      })

      const result = await authMiddlewareHandler(makeRoute('/student', { role: 'student' }))

      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('redirects authenticated users with the wrong role to their role home', async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({
        data: { user: { id: '1', email: 'student@example.com', role: 'student' } } as any,
        error: null,
      })

      await authMiddlewareHandler(makeRoute('/teacher', { role: 'teacher' }))

      expect(mockNavigateTo).toHaveBeenCalledWith('/student', { replace: true })
    })

    it('redirects authenticated users with no role to home', async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({
        data: { user: { id: '1', email: 'user@example.com' } } as any,
        error: null,
      })

      await authMiddlewareHandler(makeRoute('/student', { role: 'student' }))

      expect(mockNavigateTo).toHaveBeenCalledWith('/', { replace: true })
    })

    it('uses path fallback roles for nested teacher routes', async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({
        data: { user: { id: '1', email: 'student@example.com', role: 'student' } } as any,
        error: null,
      })

      await authMiddlewareHandler(makeRoute('/teacher/calendar'))

      expect(mockNavigateTo).toHaveBeenCalledWith('/student', { replace: true })
    })
  })
})
