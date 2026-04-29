import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, validateEmail, validatePassword, validateName } from '~/server/utils/auth'

describe('Password Hashing', () => {
  it('should hash a password', async () => {
    const password = 'testPassword123!'
    const hash = await hashPassword(password)

    expect(hash).toBeDefined()
    expect(hash).not.toBe(password)
    expect(hash.length).toBeGreaterThan(10)
  })

  it('should verify correct password', async () => {
    const password = 'testPassword123!'
    const hash = await hashPassword(password)
    const isValid = await verifyPassword(password, hash)

    expect(isValid).toBe(true)
  })

  it('should reject incorrect password', async () => {
    const password = 'testPassword123!'
    const wrongPassword = 'wrongPassword456!'
    const hash = await hashPassword(password)
    const isValid = await verifyPassword(wrongPassword, hash)

    expect(isValid).toBe(false)
  })

  it('should generate different hashes for same password', async () => {
    const password = 'testPassword123!'
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)

    expect(hash1).not.toBe(hash2)
  })
})

describe('validateEmail', () => {
  it('should return no errors for valid email', () => {
    expect(validateEmail('user@example.com')).toEqual([])
    expect(validateEmail('test.name+tag@sub.domain.org')).toEqual([])
  })

  it('should return error for empty email', () => {
    const errors = validateEmail('')
    expect(errors).toHaveLength(1)
    expect(errors[0]).toEqual({ field: 'email', message: 'Email is required' })
  })

  it('should return error for email without @', () => {
    const errors = validateEmail('notanemail')
    expect(errors).toHaveLength(1)
    expect(errors[0]).toEqual({ field: 'email', message: 'Invalid email format' })
  })

  it('should return error for email without domain', () => {
    const errors = validateEmail('user@')
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('email')
  })

  it('should return error for email with spaces', () => {
    const errors = validateEmail('user @example.com')
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('email')
  })
})

describe('validatePassword', () => {
  it('should return no errors for valid password', () => {
    expect(validatePassword('Secure123')).toEqual([])
    expect(validatePassword('MyP@ssw0rd')).toEqual([])
  })

  it('should return error for empty password', () => {
    const errors = validatePassword('')
    expect(errors).toHaveLength(1)
    expect(errors[0]).toEqual({ field: 'password', message: 'Password is required' })
  })

  it('should return error for password shorter than 8 characters', () => {
    const errors = validatePassword('Ab1')
    expect(errors).toHaveLength(1)
    expect(errors[0]).toEqual({ field: 'password', message: 'Password must be at least 8 characters' })
  })

  it('should return error for password without uppercase letter', () => {
    const errors = validatePassword('secure123')
    expect(errors).toHaveLength(1)
    expect(errors[0]).toEqual({ field: 'password', message: 'Password must contain at least one uppercase letter' })
  })

  it('should return error for password without number', () => {
    const errors = validatePassword('SecurePassword')
    expect(errors).toHaveLength(1)
    expect(errors[0]).toEqual({ field: 'password', message: 'Password must contain at least one number' })
  })
})

describe('validateName', () => {
  it('should return no errors for valid name', () => {
    expect(validateName('Alice')).toEqual([])
    expect(validateName('John Doe')).toEqual([])
  })

  it('should return error for empty name', () => {
    const errors = validateName('')
    expect(errors).toHaveLength(1)
    expect(errors[0]).toEqual({ field: 'name', message: 'Name is required' })
  })

  it('should return error for whitespace-only name', () => {
    const errors = validateName('   ')
    expect(errors).toHaveLength(1)
    expect(errors[0]).toEqual({ field: 'name', message: 'Name is required' })
  })

  it('should return error for name longer than 255 characters', () => {
    const longName = 'A'.repeat(256)
    const errors = validateName(longName)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toEqual({ field: 'name', message: 'Name must be less than 255 characters' })
  })

  it('should accept name exactly 255 characters long', () => {
    const maxName = 'A'.repeat(255)
    expect(validateName(maxName)).toEqual([])
  })
})
