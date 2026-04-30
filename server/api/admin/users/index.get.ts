import { auth } from '~~/server/utils/better-auth'
import { listUsersForAdmin } from '~~/server/services/admin-users'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: toWebRequest(event).headers,
  })

  return await listUsersForAdmin(session)
})
