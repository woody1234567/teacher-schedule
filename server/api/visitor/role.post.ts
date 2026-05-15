import { auth } from '~~/server/utils/better-auth'
import { requestRoleForVisitor, type VisitorSession } from '~~/server/services/visitor'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: toWebRequest(event).headers,
  })
  const body = await readBody<{ role?: unknown }>(event)
  try {
    const visitorSession: VisitorSession = {
      user: session?.user ? {
        id: session.user.id,
        role: session.user.role as any, // type assertion needed for auth session
      } : null,
    }
    return await requestRoleForVisitor(visitorSession, body.role)
  } catch (err: unknown) {
    if (err instanceof Error && 'statusCode' in err) {
      throw createError({
        statusCode: (err as { statusCode: number }).statusCode,
        message: err.message,
      })
    }
    throw err
  }
})
