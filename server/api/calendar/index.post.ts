import { createCalendarEvent } from '~~/server/db/queries/calendar'
import { authenticateRequest } from '~~/server/utils/auth'

interface CreateCalendarEventBody {
  title?: string
  description?: string | null
  startTime?: string
  endTime?: string
  isAvailable?: boolean
  maxStudents?: number
}

export default defineEventHandler(async (event) => {
  const user = await authenticateRequest(event)
  const body = await readBody<CreateCalendarEventBody>(event)

  if (user.role !== 'teacher') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only teachers can create calendar events',
    })
  }

  const { title, startTime, endTime, description, isAvailable, maxStudents } = body

  if (!title || !startTime || !endTime) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
      data: {
        errors: [
          ...(!title ? [{ field: 'title', message: 'Title is required' }] : []),
          ...(!startTime ? [{ field: 'startTime', message: 'Start time is required' }] : []),
          ...(!endTime ? [{ field: 'endTime', message: 'End time is required' }] : []),
        ],
      },
    })
  }

  const start = new Date(startTime)
  const end = new Date(endTime)

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

  const calendarEvent = await createCalendarEvent(user.id, {
    title,
    description: description || null,
    startTime: start,
    endTime: end,
    isAvailable: isAvailable ?? true,
    maxStudents: maxStudents ?? 1,
  })

  return {
    event: calendarEvent,
  }
})
