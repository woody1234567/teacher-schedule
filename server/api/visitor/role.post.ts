import { auth } from '~~/server/utils/better-auth'
import { pickRoleForVisitor } from '~~/server/services/visitor'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: toWebRequest(event).headers,
  })
  const body = await readBody<{ role?: unknown }>(event)
  return await pickRoleForVisitor(session, body.role)
})
