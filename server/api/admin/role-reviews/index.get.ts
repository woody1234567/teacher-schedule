import { auth } from '~~/server/utils/better-auth'
import { listPendingRequestsForAdmin } from '~~/server/services/admin-role-reviews'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: toWebRequest(event).headers,
  })
  try {
    return await listPendingRequestsForAdmin(session)
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
