import { asc, eq } from 'drizzle-orm'
import { getDatabase } from '../index'
import { users } from '../schema'

export type UserRole = 'student' | 'teacher' | 'admin' | 'visitor'
export type User = typeof users.$inferSelect
export type PublicUser = Pick<User, 'id' | 'email' | 'name' | 'emailVerified' | 'image' | 'role' | 'createdAt' | 'updatedAt'>

export interface CreateUserInput {
  email: string
  name?: string
  passwordHash?: string
  emailVerified?: boolean
  image?: string
  role?: UserRole
}

export interface UpdateUserInput {
  name?: string
  passwordHash?: string
  emailVerified?: boolean
  image?: string
  role?: UserRole
}

const publicUserColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  emailVerified: users.emailVerified,
  image: users.image,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
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

export async function listUsers(): Promise<PublicUser[]> {
  const db = getDatabase()
  return await db.select(publicUserColumns).from(users).orderBy(asc(users.createdAt))
}

export async function listTeachers(): Promise<PublicUser[]> {
  const db = getDatabase()
  return await db
    .select(publicUserColumns)
    .from(users)
    .where(eq(users.role, 'teacher'))
    .orderBy(asc(users.createdAt))
}

export async function updateUser(id: string, data: UpdateUserInput): Promise<User | undefined> {
  const db = getDatabase()
  const result = await db.update(users).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(users.id, id)).returning()
  return result[0]
}

export async function updateUserRole(id: string, role: UserRole): Promise<PublicUser | undefined> {
  const db = getDatabase()
  const result = await db.update(users).set({
    role,
    updatedAt: new Date(),
  }).where(eq(users.id, id)).returning(publicUserColumns)
  return result[0]
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = getDatabase()
  const result = await db.delete(users).where(eq(users.id, id)).returning()
  return result.length > 0
}
