import { updateUserRole, type PublicUser, type UserRole } from '~~/server/db/queries/users'

export type VisitorSession = {
  user?: {
    id?: string
    role?: UserRole | null
  } | null
} | null

type PickableRole = 'teacher' | 'student'

function serviceError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

export async function pickRoleForVisitor(
  session: VisitorSession,
  role: unknown,
): Promise<PublicUser> {
  if (!session?.user?.id) {
    throw serviceError('Authentication required', 401)
  }

  if (session.user.role !== 'visitor') {
    throw serviceError('Only visitors can pick a role', 403)
  }

  if (role !== 'teacher' && role !== 'student') {
    throw serviceError('Role must be teacher or student', 400)
  }

  const user = await updateUserRole(session.user.id, role as PickableRole)
  if (!user) {
    throw serviceError('User not found', 404)
  }

  return user
}
