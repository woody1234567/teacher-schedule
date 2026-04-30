import { getCalendarEventById, updateCalendarEvent } from '~~/server/db/queries/calendar'
import { authenticateRequest } from '~~/server/utils/auth'

interface UpdateCalendarEventBody {
  title?: string
  description?: string | null
  startTime?: string
  endTime?: string
  isAvailable?: boolean
  maxStudents?: number
}

export default defineEventHandler(async (event) => {
  const user = await authenticateRequest(event)
  const { id } = event.context.params ?? {}
  const eventId = Number(id)
  const body = await readBody<UpdateCalendarEventBody>(event)

  if (user.role !== 'teacher') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only teachers can update calendar events',
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
      statusMessage: 'You can only update your own events',
    })
  }

  const start = body.startTime ? new Date(body.startTime) : existingEvent.startTime
  const end = body.endTime ? new Date(body.endTime) : existingEvent.endTime

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid event time',
    })
  }

  if (start >= end) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Start time must be before end time',
    })
  }

  const updatedEvent = await updateCalendarEvent(eventId, {
    title: body.title,
    description: body.description,
    startTime: body.startTime ? start : undefined,
    endTime: body.endTime ? end : undefined,
    isAvailable: body.isAvailable,
    maxStudents: body.maxStudents,
  })

  return {
    event: updatedEvent,
  }
})
