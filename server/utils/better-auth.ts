import { betterAuth } from 'better-auth'
import { bearer } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { hash, verify } from 'argon2'
import { getDatabase } from '../../server/db/index'
import * as schema from '../../server/db/schema'

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

export const auth = betterAuth({
  database: drizzleAdapter(getDatabase(), {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  socialProviders: googleClientId && googleClientSecret
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      }
    : undefined,
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
