import {
  listUsers,
  updateUserRole,
  type PublicUser,
  type UserRole,
} from '~~/server/db/queries/users'

export type AdminSession = {
  user?: {
    id?: string
    role?: UserRole | null
  } | null
} | null

const roles = ['student', 'teacher', 'admin', 'visitor'] as const

function isUserRole(role: unknown): role is UserRole {
  return roles.includes(role as UserRole)
}

function serviceError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

export function assertAdminSession(session: AdminSession) {
  if (!session?.user?.id) {
    throw serviceError('Authentication required', 401)
  }

  if (session.user.role !== 'admin') {
    throw serviceError('Admin access required', 403)
  }

  return {
    id: session.user.id,
    role: session.user.role,
  }
}

export async function listUsersForAdmin(session: AdminSession): Promise<PublicUser[]> {
  assertAdminSession(session)
  return await listUsers()
}

export async function updateUserRoleForAdmin(
  session: AdminSession,
  userId: string,
  role: unknown,
): Promise<PublicUser> {
  const admin = assertAdminSession(session)

  if (!isUserRole(role)) {
    throw serviceError('Invalid role', 400)
  }

  if (admin.id === userId) {
    throw serviceError('Admins cannot change their own role', 400)
  }

  const user = await updateUserRole(userId, role)
  if (!user) {
    throw serviceError('User not found', 404)
  }

  return user
}
