import {
  createRoleRequest,
  getPendingRequestByUserId,
  type PickableRole,
  type RoleReview,
} from '~~/server/db/queries/role-reviews'
import type { UserRole } from '~~/server/db/queries/users'

export type VisitorSession = {
  user?: {
    id?: string
    role?: UserRole | null
  } | null
} | null

function serviceError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

export async function requestRoleForVisitor(
  session: VisitorSession,
  role: unknown,
): Promise<RoleReview> {
  if (!session?.user?.id) {
    throw serviceError('Authentication required', 401)
  }

  if (session.user.role !== 'visitor') {
    throw serviceError('Only visitors can request a role', 403)
  }

  if (role !== 'teacher' && role !== 'student') {
    throw serviceError('Role must be teacher or student', 400)
  }

  const existing = await getPendingRequestByUserId(session.user.id)
  if (existing) return existing

  return await createRoleRequest(session.user.id, role as PickableRole)
}
