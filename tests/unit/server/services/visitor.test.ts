import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/server/db/queries/users', () => ({
  updateUserRole: vi.fn(),
}))

import { updateUserRole } from '~/server/db/queries/users'
import { pickRoleForVisitor } from '~/server/services/visitor'

const mockUpdateUserRole = vi.mocked(updateUserRole)

const visitorSession = {
  user: { id: 'user-1', role: 'visitor' as const },
}

const mockPublicUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: null,
  emailVerified: false,
  image: null,
  role: 'teacher' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('pickRoleForVisitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws 401 when session is null', async () => {
    await expect(pickRoleForVisitor(null, 'teacher')).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('throws 401 when session has no user id', async () => {
    await expect(
      pickRoleForVisitor({ user: { id: undefined, role: 'visitor' } }, 'teacher'),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when user is not a visitor', async () => {
    const session = { user: { id: 'user-1', role: 'student' as const } }
    await expect(pickRoleForVisitor(session, 'teacher')).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('throws 400 when role is admin', async () => {
    await expect(pickRoleForVisitor(visitorSession, 'admin')).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws 400 when role is visitor', async () => {
    await expect(pickRoleForVisitor(visitorSession, 'visitor')).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws 400 when role is an unknown string', async () => {
    await expect(pickRoleForVisitor(visitorSession, 'superadmin')).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws 404 when updateUserRole returns undefined', async () => {
    mockUpdateUserRole.mockResolvedValue(undefined)
    await expect(pickRoleForVisitor(visitorSession, 'teacher')).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('calls updateUserRole with correct args and returns user for teacher', async () => {
    mockUpdateUserRole.mockResolvedValue(mockPublicUser)
    const result = await pickRoleForVisitor(visitorSession, 'teacher')
    expect(mockUpdateUserRole).toHaveBeenCalledWith('user-1', 'teacher')
    expect(result).toEqual(mockPublicUser)
  })

  it('calls updateUserRole with correct args and returns user for student', async () => {
    mockUpdateUserRole.mockResolvedValue({ ...mockPublicUser, role: 'student' })
    const result = await pickRoleForVisitor(visitorSession, 'student')
    expect(mockUpdateUserRole).toHaveBeenCalledWith('user-1', 'student')
    expect(result.role).toBe('student')
  })
})
