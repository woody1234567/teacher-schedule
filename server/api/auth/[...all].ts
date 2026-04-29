import { auth } from '~/server/utils/better-auth'

export default defineEventHandler(event => auth.handler(toWebRequest(event)))
