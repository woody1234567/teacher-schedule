import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAdminUsers } from '~/app/composables/useAdminUsers'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('useAdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads users from the admin API', async () => {
    mockFetch.mockResolvedValueOnce([
      { id: 'u1', email: 'a@example.com', name: 'A', role: 'student' },
    ])

    const adminUsers = useAdminUsers()
    await adminUsers.loadUsers()

    expect(mockFetch).toHaveBeenCalledWith('/api/admin/users')
    expect(adminUsers.users.value).toEqual([
      { id: 'u1', email: 'a@example.com', name: 'A', role: 'student' },
    ])
  })

  it('updates a user role and replaces the user locally', async () => {
    mockFetch
      .mockResolvedValueOnce([
        { id: 'u1', email: 'a@example.com', name: 'A', role: 'student' },
      ])
      .mockResolvedValueOnce({ id: 'u1', email: 'a@example.com', name: 'A', role: 'teacher' })

    const adminUsers = useAdminUsers()
    await adminUsers.loadUsers()
    await adminUsers.updateRole('u1', 'teacher')

    expect(mockFetch).toHaveBeenLastCalledWith('/api/admin/users/u1/role', {
      method: 'PATCH',
      body: { role: 'teacher' },
    })
    expect(adminUsers.users.value[0]?.role).toBe('teacher')
  })

  it('optimistically updates a role while only marking that user as updating', async () => {
    let resolveUpdate: ((user: any) => void) | undefined
    mockFetch
      .mockResolvedValueOnce([
        { id: 'u1', email: 'a@example.com', name: 'A', role: 'student' },
        { id: 'u2', email: 'b@example.com', name: 'B', role: 'student' },
      ])
      .mockReturnValueOnce(new Promise(resolve => {
        resolveUpdate = resolve
      }))

    const adminUsers = useAdminUsers()
    await adminUsers.loadUsers()

    const updatePromise = adminUsers.updateRole('u1', 'teacher')

    expect(adminUsers.loading.value).toBe(false)
    expect(adminUsers.isUpdatingUser('u1')).toBe(true)
    expect(adminUsers.isUpdatingUser('u2')).toBe(false)
    expect(adminUsers.users.value[0]?.role).toBe('teacher')

    resolveUpdate?.({ id: 'u1', email: 'a@example.com', name: 'A', role: 'teacher' })
    await updatePromise

    expect(adminUsers.isUpdatingUser('u1')).toBe(false)
  })

  it('restores the previous role when updating fails', async () => {
    mockFetch
      .mockResolvedValueOnce([
        { id: 'u1', email: 'a@example.com', name: 'A', role: 'student' },
      ])
      .mockRejectedValueOnce(new Error('Invalid role'))

    const adminUsers = useAdminUsers()
    await adminUsers.loadUsers()

    await expect(adminUsers.updateRole('u1', 'teacher')).rejects.toThrow('Invalid role')

    expect(adminUsers.users.value[0]?.role).toBe('student')
    expect(adminUsers.isUpdatingUser('u1')).toBe(false)
    expect(adminUsers.error.value).toBe('Invalid role')
  })

  it('stores an error message when loading fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Forbidden'))

    const adminUsers = useAdminUsers()
    await adminUsers.loadUsers()

    expect(adminUsers.error.value).toBe('Forbidden')
  })
})
