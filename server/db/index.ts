import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let db: ReturnType<typeof drizzle> | null = null

export function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  if (!db) {
    const client = postgres(databaseUrl)
    db = drizzle(client, { schema })
  }

  return db
}

export async function testConnection() {
  try {
    const database = getDatabase()
    const result = await database.select().from(schema.users).limit(1)
    return { success: true, message: 'Database connection successful' }
  } catch (error) {
    return { success: false, message: String(error) }
  }
}

export default getDatabase()
