import { eq } from 'drizzle-orm'
import { getDatabase } from '~/server/db/index'
import { users } from '~/server/db/schema'

export type User = typeof users.$inferSelect

export interface CreateUserInput {
  email: string
  name?: string
  passwordHash?: string
  emailVerified?: boolean
  image?: string
}

export interface UpdateUserInput {
  name?: string
  passwordHash?: string
  emailVerified?: boolean
  image?: string
}

export async function createUser(data: CreateUserInput): Promise<User> {
  const db = getDatabase()
  const [user] = await db.insert(users).values({
    id: crypto.randomUUID(),
    ...data,
    updatedAt: new Date(),
  }).returning()
  return user
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = getDatabase()
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return result[0]
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = getDatabase()
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return result[0]
}

export async function updateUser(id: string, data: UpdateUserInput): Promise<User | undefined> {
  const db = getDatabase()
  const result = await db.update(users).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(users.id, id)).returning()
  return result[0]
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = getDatabase()
  const result = await db.delete(users).where(eq(users.id, id)).returning()
  return result.length > 0
}
