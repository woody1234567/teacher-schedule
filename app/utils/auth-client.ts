import { createAuthClient } from 'better-auth/vue'
import type { auth } from '~~/server/utils/better-auth'

export const authClient = createAuthClient<typeof auth>({
  baseURL: import.meta.client ? undefined : (process.env.BETTER_AUTH_URL || 'http://localhost:3000'),
})
