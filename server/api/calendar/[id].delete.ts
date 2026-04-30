import { deleteCalendarEvent, getCalendarEventById } from '~~/server/db/queries/calendar'
import { authenticateRequest } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await authenticateRequest(event)
  const { id } = event.context.params ?? {}
  const eventId = Number(id)

  if (user.role !== 'teacher') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only teachers can delete calendar events',
    })
  }

  if (!Number.isInteger(eventId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid event id',
    })
  }

  const existingEvent = await getCalendarEventById(eventId)

  if (!existingEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Event not found',
    })
  }

  if (existingEvent.teacherId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You can only delete your own events',
    })
  }

  await deleteCalendarEvent(eventId)

  return {
    success: true,
    message: 'Event deleted successfully',
  }
})
