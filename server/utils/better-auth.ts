import { betterAuth } from 'better-auth'
import { bearer } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { hash, verify } from 'argon2'
import { getDatabase } from '../../server/db/index'
import * as schema from '../../server/db/schema'

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

if (!googleClientId || !googleClientSecret) {
  throw new Error('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET before starting Nuxt.')
}

export const auth = betterAuth({
  appName: 'Teacher Schedule',
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(getDatabase(), {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'visitor',
        transform: {
          input: (role: unknown) => {
            const valid = ['student', 'teacher', 'admin', 'visitor']
            return valid.includes(role as string) ? (role as string) : 'visitor'
          },
        },
      },
    },
  },
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      scope: ['openid', 'email', 'profile'],
      prompt: 'select_account',
    },
  },
  plugins: [bearer()],
  emailAndPassword: {
    enabled: true,
    password: {
      hash: (password: string) =>
        hash(password, {
          type: 2, // Argon2id
          memoryCost: 19456,
          timeCost: 2,
          parallelism: 1,
        }),
      verify: ({ password, hash: storedHash }: { password: string; hash: string }) =>
        verify(storedHash, password),
    },
  },
})

export type Session = typeof auth.$Infer.Session
