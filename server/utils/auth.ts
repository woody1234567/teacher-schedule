import { hash, verify } from 'argon2'

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, {
    type: 2, // Argon2id
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  })
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await verify(hashedPassword, password)
}

export function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function authenticateRequest(event: any) {
  const token = getCookie(event, 'auth_token')

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const { auth } = await import('./better-auth')
  const session = await auth.api.getSession({
    headers: new Headers({
      Authorization: `Bearer ${token}`,
    }),
  })

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Session expired',
    })
  }

  return session.user
}

export interface ValidationError {
  field: string
  message: string
}

export function validateEmail(email: string): ValidationError[] {
  const errors: ValidationError[] = []
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' })
  }
  else if (!emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' })
  }

  return errors
}

export function validatePassword(password: string): ValidationError[] {
  const errors: ValidationError[] = []

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' })
  }
  else if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' })
  }
  else if (!/[A-Z]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' })
  }
  else if (!/[0-9]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one number' })
  }

  return errors
}

export function validateName(name: string): ValidationError[] {
  const errors: ValidationError[] = []

  if (!name || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' })
  }
  else if (name.length > 255) {
    errors.push({ field: 'name', message: 'Name must be less than 255 characters' })
  }

  return errors
}
