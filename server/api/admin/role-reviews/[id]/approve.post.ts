import { auth } from '~~/server/utils/better-auth'
import { approveRoleRequest } from '~~/server/services/admin-role-reviews'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: toWebRequest(event).headers,
  })
  const id = getRouterParam(event, 'id')
  if (!id || Number.isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Valid request id is required' })
  }
  try {
    return await approveRoleRequest(session, Number(id))
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
