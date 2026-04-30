import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  assertAdminSession,
  listUsersForAdmin,
  updateUserRoleForAdmin,
} from '~/server/services/admin-users'
import {
  listUsers,
  updateUserRole,
} from '~~/server/db/queries/users'

vi.mock('~~/server/db/queries/users', () => ({
  listUsers: vi.fn(),
  updateUserRole: vi.fn(),
}))

describe('admin users service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('assertAdminSession', () => {
    it('rejects missing sessions', () => {
      expect(() => assertAdminSession(null)).toThrow('Authentication required')
    })

    it('rejects non-admin users', () => {
      expect(() => assertAdminSession({ user: { id: 'user-1', role: 'teacher' } })).toThrow('Admin access required')
    })

    it('returns the admin user for admin sessions', () => {
      const user = assertAdminSession({ user: { id: 'admin-1', role: 'admin' } })

      expect(user).toEqual({ id: 'admin-1', role: 'admin' })
    })
  })

  describe('listUsersForAdmin', () => {
    it('returns all users for admins', async () => {
      vi.mocked(listUsers).mockResolvedValue([
        { id: 'u1', email: 'a@example.com', name: 'A', role: 'student', emailVerified: false, image: null, createdAt: new Date(), updatedAt: new Date() },
      ] as any)

      const users = await listUsersForAdmin({ user: { id: 'admin-1', role: 'admin' } })

      expect(users).toHaveLength(1)
      expect(listUsers).toHaveBeenCalledOnce()
    })

    it('rejects non-admin users before querying', async () => {
      await expect(listUsersForAdmin({ user: { id: 'teacher-1', role: 'teacher' } })).rejects.toThrow('Admin access required')

      expect(listUsers).not.toHaveBeenCalled()
    })
  })

  describe('updateUserRoleForAdmin', () => {
    it('updates another user role for admins', async () => {
      vi.mocked(updateUserRole).mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        role: 'teacher',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const user = await updateUserRoleForAdmin(
        { user: { id: 'admin-1', role: 'admin' } },
        'user-1',
        'teacher',
      )

      expect(user.role).toBe('teacher')
      expect(updateUserRole).toHaveBeenCalledWith('user-1', 'teacher')
    })

    it('rejects invalid roles', async () => {
      await expect(
        updateUserRoleForAdmin({ user: { id: 'admin-1', role: 'admin' } }, 'user-1', 'owner'),
      ).rejects.toThrow('Invalid role')

      expect(updateUserRole).not.toHaveBeenCalled()
    })

    it('prevents admins from changing their own role', async () => {
      await expect(
        updateUserRoleForAdmin({ user: { id: 'admin-1', role: 'admin' } }, 'admin-1', 'student'),
      ).rejects.toThrow('Admins cannot change their own role')

      expect(updateUserRole).not.toHaveBeenCalled()
    })

    it('returns not found when target user does not exist', async () => {
      vi.mocked(updateUserRole).mockResolvedValue(undefined)

      await expect(
        updateUserRoleForAdmin({ user: { id: 'admin-1', role: 'admin' } }, 'missing', 'student'),
      ).rejects.toThrow('User not found')
    })
  })
})
