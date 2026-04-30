import { listTeachers } from '~~/server/db/queries/users'

export default defineEventHandler(async () => {
  return await listTeachers()
})
