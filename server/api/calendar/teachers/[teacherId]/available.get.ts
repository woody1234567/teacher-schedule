import { getAvailableSlots } from '~~/server/db/queries/calendar'
import { getUserById } from '~~/server/db/queries/users'

export default defineEventHandler(async (event) => {
  const teacherId = event.context.params?.teacherId

  if (!teacherId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Teacher id is required',
    })
  }

  const teacher = await getUserById(teacherId)

  if (!teacher || teacher.role !== 'teacher') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Teacher not found',
    })
  }

  const availableSlots = await getAvailableSlots(teacherId)

  return {
    teacher: {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      image: teacher.image,
    },
    availableSlots,
  }
})
