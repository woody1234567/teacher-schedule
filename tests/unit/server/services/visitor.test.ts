import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db/queries/role-reviews', () => ({
  createRoleRequest: vi.fn(),
  getPendingRequestByUserId: vi.fn(),
}))

import { createRoleRequest, getPendingRequestByUserId } from '~/server/db/queries/role-reviews'
import { requestRoleForVisitor } from '~/server/services/visitor'

const makeSession = (role: string | null = 'visitor', id = 'u1') => ({
  user: { id, role },
})

describe('requestRoleForVisitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws 401 when session is null', async () => {
    await expect(requestRoleForVisitor(null, 'teacher')).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 when session has no user id', async () => {
    await expect(requestRoleForVisitor({ user: null }, 'teacher')).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when user role is not visitor', async () => {
    await expect(requestRoleForVisitor(makeSession('student'), 'teacher')).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 400 when requested role is invalid', async () => {
    await expect(requestRoleForVisitor(makeSession(), 'admin')).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when requested role is undefined', async () => {
    await expect(requestRoleForVisitor(makeSession(), undefined)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns existing pending request without creating a new one', async () => {
    const existing = { id: 1, userId: 'u1', requestedRole: 'teacher', status: 'pending' }
    vi.mocked(getPendingRequestByUserId).mockResolvedValueOnce(existing as any)

    const result = await requestRoleForVisitor(makeSession(), 'student')

    expect(createRoleRequest).not.toHaveBeenCalled()
    expect(result).toBe(existing)
  })

  it('creates a role request for teacher when no pending exists', async () => {
    vi.mocked(getPendingRequestByUserId).mockResolvedValueOnce(undefined)
    const created = { id: 1, userId: 'u1', requestedRole: 'teacher', status: 'pending' }
    vi.mocked(createRoleRequest).mockResolvedValueOnce(created as any)

    const result = await requestRoleForVisitor(makeSession(), 'teacher')

    expect(createRoleRequest).toHaveBeenCalledWith('u1', 'teacher')
    expect(result).toBe(created)
  })

  it('creates a role request for student when no pending exists', async () => {
    vi.mocked(getPendingRequestByUserId).mockResolvedValueOnce(undefined)
    const created = { id: 2, userId: 'u1', requestedRole: 'student', status: 'pending' }
    vi.mocked(createRoleRequest).mockResolvedValueOnce(created as any)

    const result = await requestRoleForVisitor(makeSession(), 'student')

    expect(createRoleRequest).toHaveBeenCalledWith('u1', 'student')
    expect(result).toBe(created)
  })
})
