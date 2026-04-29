import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient({
  baseURL: import.meta.client ? undefined : (process.env.BETTER_AUTH_URL || 'http://localhost:3000'),
})
