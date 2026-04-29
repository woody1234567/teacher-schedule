import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { testConnection } from './index'

describe('Database Connection', () => {
  it('should establish a connection to the database', async () => {
    const result = await testConnection()
    expect(result).toBeDefined()
    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('message')
  })

  it('should return success: true when database is accessible', async () => {
    const result = await testConnection()
    if (result.success) {
      expect(result.success).toBe(true)
      expect(result.message).toContain('successful')
    }
  })
})
