import {
  listPendingRoleRequests,
  getRoleRequestById,
  updateRoleRequestStatus,
  type RoleReview,
  type RoleReviewWithUser,
} from '~~/server/db/queries/role-reviews'
import { updateUserRole, type PublicUser, type UserRole } from '~~/server/db/queries/users'
import { assertAdminSession, type AdminSession } from '~~/server/services/admin-users'

function serviceError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

export async function listPendingRequestsForAdmin(
  session: AdminSession,
): Promise<RoleReviewWithUser[]> {
  assertAdminSession(session)
  return await listPendingRoleRequests()
}

export async function approveRoleRequest(
  session: AdminSession,
  requestId: number,
): Promise<{ review: RoleReview; user: PublicUser }> {
  const admin = assertAdminSession(session)

  const request = await getRoleRequestById(requestId)
  if (!request) throw serviceError('Request not found', 404)
  if (request.status !== 'pending') throw serviceError('Request is not pending', 409)

  const pickable: readonly string[] = ['teacher', 'student']
  if (!pickable.includes(request.requestedRole)) {
    throw serviceError(`Invalid stored role: ${request.requestedRole}`, 422)
  }

  const user = await updateUserRole(request.userId, request.requestedRole as 'teacher' | 'student')
  if (!user) throw serviceError('User not found', 404)

  const review = await updateRoleRequestStatus(requestId, 'approved', admin.id)
  if (!review) throw serviceError('Request not found after update', 404)
  return { review, user }
}

export async function rejectRoleRequest(
  session: AdminSession,
  requestId: number,
): Promise<RoleReview> {
  const admin = assertAdminSession(session)

  const request = await getRoleRequestById(requestId)
  if (!request) throw serviceError('Request not found', 404)
  if (request.status !== 'pending') throw serviceError('Request is not pending', 409)

  const review = await updateRoleRequestStatus(requestId, 'rejected', admin.id)
  if (!review) throw serviceError('Request not found after update', 404)
  return review
}
