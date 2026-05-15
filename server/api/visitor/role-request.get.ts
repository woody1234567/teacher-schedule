import { auth } from '~~/server/utils/better-auth'
import { getPendingRequestByUserId } from '~~/server/db/queries/role-reviews'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: toWebRequest(event).headers,
  })

  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const request = await getPendingRequestByUserId(session.user.id)
  return request ?? null
})
