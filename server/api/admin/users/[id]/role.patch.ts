import { auth } from '~~/server/utils/better-auth'
import { updateUserRoleForAdmin } from '~~/server/services/admin-users'

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')
  const body = await readBody<{ role?: unknown }>(event)
  const session = await auth.api.getSession({
    headers: new Headers(getRequestHeaders(event) as Record<string, string>),
  })

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User id is required',
    })
  }

  return await updateUserRoleForAdmin(session, userId, body.role)
})
