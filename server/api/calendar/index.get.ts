import { getCalendarEventsByTeacher } from '~~/server/db/queries/calendar'
import { authenticateRequest } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await authenticateRequest(event)

  if (user.role !== 'teacher') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only teachers can access this endpoint',
    })
  }

  const events = await getCalendarEventsByTeacher(user.id)

  return {
    events,
  }
})
