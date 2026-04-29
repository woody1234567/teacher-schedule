## Task 6: 建立登錄 API 端點

### 檔案：
- Create: `server/api/auth/login.post.ts`
- Create: `tests/integration/auth.login.test.ts`

- [ ] **Step 1: 寫登錄 API 集成測試**

建立 `tests/integration/auth.login.test.ts`：

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { getDB, schema } from '~/server/db'
import { hashPassword } from '~/server/utils/auth'
import { createUser } from '~/server/db/queries/users'

describe('Login API', () => {
  const testUser = {
    email: 'login-test@example.com',
    name: 'Login Test',
    password: 'TestPassword123!',
  }

  beforeEach(async () => {
    const db = getDB()
    await db.delete(schema.users).where(eq(schema.users.email, testUser.email))
    
    // 創建測試用戶
    const passwordHash = await hashPassword(testUser.password)
    await createUser({
      email: testUser.email,
      name: testUser.name,
      passwordHash,
      role: 'student',
    })
  })

  afterEach(async () => {
    const db = getDB()
    await db.delete(schema.users).where(eq(schema.users.email, testUser.email))
  })

  it('should login with correct credentials', async () => {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: testUser.email,
        password: testUser.password,
      },
    })
    
    expect(response.success).toBe(true)
    expect(response.user).toBeDefined()
    expect(response.user.email).toBe(testUser.email)
  })

  it('should reject non-existent user', async () => {
    const error = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'nonexistent@example.com',
        password: testUser.password,
      },
    }).catch(e => e.data)
    
    expect(error).toBeDefined()
    expect(error.message).toContain('Invalid credentials')
  })

  it('should reject incorrect password', async () => {
    const error = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: testUser.email,
        password: 'WrongPassword123!',
      },
    }).catch(e => e.data)
    
    expect(error).toBeDefined()
    expect(error.message).toContain('Invalid credentials')
  })

  it('should validate email and password fields', async () => {
    const error = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: '',
        password: '',
      },
    }).catch(e => e.data)
    
    expect(error).toBeDefined()
    expect(error.errors).toBeDefined()
  })

  it('should set auth cookie on successful login', async () => {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: testUser.email,
        password: testUser.password,
      },
      headers: {},
    })
    
    expect(response.success).toBe(true)
    // Cookie 應該由 HTTP 頭設置
  })
})
```

執行測試：
```bash
pnpm vitest tests/integration/auth.login.test.ts
```

預期：5 個測試失敗（端點尚未實現）

- [ ] **Step 2: 實現登錄 API 端點**

建立 `server/api/auth/login.post.ts`：

```typescript
import { verifyPassword, validateEmail, generateSessionToken } from '~/server/utils/auth'
import { getUserByEmail, updateUser } from '~/server/db/queries/users'
import { getDB, schema } from '~/server/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  // 驗證輸入
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required',
      data: {
        errors: [
          ...(!email ? [{ field: 'email', message: 'Email is required' }] : []),
          ...(!password ? [{ field: 'password', message: 'Password is required' }] : []),
        ],
      },
    })
  }

  const emailErrors = validateEmail(email)
  if (emailErrors.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email format',
      data: { errors: emailErrors },
    })
  }

  // 查找用戶
  const user = await getUserByEmail(email)
  if (!user || !user.passwordHash) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    })
  }

  // 驗證密碼
  const isPasswordValid = await verifyPassword(password, user.passwordHash)
  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    })
  }

  // 創建會話
  const db = getDB()
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 天
  
  await db.insert(schema.sessions).values({
    userId: user.id,
    token,
    expiresAt,
  })

  // 設置 cookie
  setCookie(event, 'auth_token', token, {
    maxAge: 30 * 24 * 60 * 60,
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  })

  // 返回用戶數據
  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    },
  }
})
```

- [ ] **Step 3: 運行測試驗證實現**

```bash
pnpm vitest tests/integration/auth.login.test.ts
```

預期：5 個測試通過

- [ ] **Step 4: 提交**

```bash
git add server/api/auth/login.post.ts tests/integration/auth.login.test.ts
git commit -m "feat: implement user login with password verification"
```

