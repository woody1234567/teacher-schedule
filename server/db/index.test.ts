import { describe, it, expect } from 'vitest'
import { testConnection } from './index'

describe('Database Connection', { timeout: 15000 }, () => {
  it('should establish a connection to the database', async () => {
    const result = await testConnection()
    expect(result).toBeDefined()
    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('message')
  }, 15000)

  it('should return success: true when database is accessible', async () => {
    const result = await testConnection()
    expect(result.success).toBe(true)
    expect(result.message).toContain('successful')
  }, 15000)
})
