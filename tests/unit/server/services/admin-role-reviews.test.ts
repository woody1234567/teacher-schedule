import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db/queries/role-reviews', () => ({
  listPendingRoleRequests: vi.fn(),
  getRoleRequestById: vi.fn(),
  updateRoleRequestStatus: vi.fn(),
}))

vi.mock('~/server/db/queries/users', () => ({
  updateUserRole: vi.fn(),
}))

import { listPendingRoleRequests, getRoleRequestById, updateRoleRequestStatus } from '~/server/db/queries/role-reviews'
import { updateUserRole } from '~/server/db/queries/users'
import { listPendingRequestsForAdmin, approveRoleRequest, rejectRoleRequest } from '~/server/services/admin-role-reviews'

const adminSession = { user: { id: 'admin1', role: 'admin' as const } }
const studentSession = { user: { id: 'u1', role: 'student' as const } }

describe('listPendingRequestsForAdmin', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws 403 for non-admin', async () => {
    await expect(listPendingRequestsForAdmin(studentSession)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns pending requests for admin', async () => {
    const requests = [{ id: 1, requestedRole: 'teacher', user: { email: 'a@b.com' } }]
    vi.mocked(listPendingRoleRequests).mockResolvedValueOnce(requests as any)

    const result = await listPendingRequestsForAdmin(adminSession)

    expect(listPendingRoleRequests).toHaveBeenCalled()
    expect(result).toBe(requests)
  })
})

describe('approveRoleRequest', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws 403 for non-admin', async () => {
    await expect(approveRoleRequest(studentSession, 1)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 404 when request not found', async () => {
    vi.mocked(getRoleRequestById).mockResolvedValueOnce(undefined)
    await expect(approveRoleRequest(adminSession, 999)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 409 when request is already approved', async () => {
    vi.mocked(getRoleRequestById).mockResolvedValueOnce({ id: 1, status: 'approved', userId: 'u1', requestedRole: 'teacher' } as any)
    await expect(approveRoleRequest(adminSession, 1)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 409 when request is already rejected', async () => {
    vi.mocked(getRoleRequestById).mockResolvedValueOnce({ id: 1, status: 'rejected', userId: 'u1', requestedRole: 'teacher' } as any)
    await expect(approveRoleRequest(adminSession, 1)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('updates user role and marks request approved', async () => {
    const request = { id: 1, status: 'pending', userId: 'u1', requestedRole: 'teacher' }
    const user = { id: 'u1', role: 'teacher', email: 'a@b.com' }
    const review = { id: 1, status: 'approved' }
    vi.mocked(getRoleRequestById).mockResolvedValueOnce(request as any)
    vi.mocked(updateUserRole).mockResolvedValueOnce(user as any)
    vi.mocked(updateRoleRequestStatus).mockResolvedValueOnce(review as any)

    const result = await approveRoleRequest(adminSession, 1)

    expect(updateUserRole).toHaveBeenCalledWith('u1', 'teacher')
    expect(updateRoleRequestStatus).toHaveBeenCalledWith(1, 'approved', 'admin1')
    expect(result).toEqual({ review, user })
  })
})

describe('rejectRoleRequest', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws 403 for non-admin', async () => {
    await expect(rejectRoleRequest(studentSession, 1)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 404 when request not found', async () => {
    vi.mocked(getRoleRequestById).mockResolvedValueOnce(undefined)
    await expect(rejectRoleRequest(adminSession, 999)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 409 when request is not pending', async () => {
    vi.mocked(getRoleRequestById).mockResolvedValueOnce({ id: 1, status: 'rejected', userId: 'u1', requestedRole: 'teacher' } as any)
    await expect(rejectRoleRequest(adminSession, 1)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('marks request rejected without touching user role', async () => {
    const request = { id: 1, status: 'pending', userId: 'u1', requestedRole: 'teacher' }
    const review = { id: 1, status: 'rejected' }
    vi.mocked(getRoleRequestById).mockResolvedValueOnce(request as any)
    vi.mocked(updateRoleRequestStatus).mockResolvedValueOnce(review as any)

    const result = await rejectRoleRequest(adminSession, 1)

    expect(updateUserRole).not.toHaveBeenCalled()
    expect(updateRoleRequestStatus).toHaveBeenCalledWith(1, 'rejected', 'admin1')
    expect(result).toBe(review)
  })
})
