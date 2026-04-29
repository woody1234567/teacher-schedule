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

type RouteMeta = { auth?: false }
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

    it('redirects authenticated user away from /auth/* to home', async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({
        data: { user: { id: '1', email: 'a@b.com' } } as any,
        error: null,
      })

      await authMiddlewareHandler(makeRoute('/auth/login', { auth: false }))

      expect(mockNavigateTo).toHaveBeenCalledWith('/', { replace: true })
    })

    it('does not redirect authenticated user on non-/auth public route', async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({
        data: { user: { id: '1', email: 'a@b.com' } } as any,
        error: null,
      })

      const result = await authMiddlewareHandler(makeRoute('/', { auth: false }))

      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })

  describe('protected routes (default)', () => {
    it('redirects unauthenticated user to login', async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({ data: null, error: null })

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

    it('allows authenticated user on nested protected route', async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({
        data: { user: { id: '1', email: 'a@b.com' } } as any,
        error: null,
      })

      const result = await authMiddlewareHandler(makeRoute('/teacher/calendar'))

      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })
})
