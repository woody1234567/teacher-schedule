import { auth } from '~~/server/utils/better-auth'
import { requestRoleForVisitor } from '~~/server/services/visitor'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ role?: unknown }>(event)
  const session = await auth.api.getSession({
    headers: new Headers(getRequestHeaders(event) as Record<string, string>),
  })
  try {
    return await requestRoleForVisitor(session, body.role)
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
