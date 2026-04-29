## Task 5: 建立註冊 API 端點

### 檔案：
- Create: `server/api/auth/register.post.ts`
- Create: `tests/integration/auth.register.test.ts`

- [ ] **Step 1: 寫註冊 API 集成測試**

建立 `tests/integration/auth.register.test.ts`：

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { getDB, schema } from '~/server/db'

describe('Register API', () => {
  const testUser = {
    email: 'register-test@example.com',
    name: 'Register Test',
    password: 'TestPassword123!',
    role: 'student',
  }

  beforeEach(async () => {
    const db = getDB()
    await db.delete(schema.users).where(eq(schema.users.email, testUser.email))
  })

  afterEach(async () => {
    const db = getDB()
    await db.delete(schema.users).where(eq(schema.users.email, testUser.email))
  })

  it('should register a new user', async () => {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: testUser,
    })
    
    expect(response.success).toBe(true)
    expect(response.user).toBeDefined()
    expect(response.user.email).toBe(testUser.email)
    expect(response.user.role).toBe(testUser.role)
  })

  it('should reject duplicate email', async () => {
    // 第一次註冊
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: testUser,
    })

    // 嘗試重複註冊
    const error = await $fetch('/api/auth/register', {
      method: 'POST',
      body: testUser,
    }).catch(e => e.data)
    
    expect(error).toBeDefined()
    expect(error.message).toContain('already exists')
  })

  it('should validate email format', async () => {
    const error = await $fetch('/api/auth/register', {
      method: 'POST',
      body: { ...testUser, email: 'invalid-email' },
    }).catch(e => e.data)
    
    expect(error).toBeDefined()
    expect(error.errors).toBeDefined()
  })

  it('should validate password strength', async () => {
    const error = await $fetch('/api/auth/register', {
      method: 'POST',
      body: { ...testUser, password: 'weak' },
    }).catch(e => e.data)
    
    expect(error).toBeDefined()
    expect(error.errors).toBeDefined()
  })

  it('should not return password hash', async () => {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: testUser,
    })
    
    expect(response.user.passwordHash).toBeUndefined()
  })
})
```

執行測試：
```bash
pnpm vitest tests/integration/auth.register.test.ts
```

預期：5 個測試失敗（端點尚未實現）

- [ ] **Step 2: 建立目錄結構**

```bash
mkdir -p server/api/auth
```

- [ ] **Step 3: 實現註冊 API 端點**

建立 `server/api/auth/register.post.ts`：

```typescript
import { hashPassword, validateEmail, validatePassword, validateName, generateSessionToken } from '~/server/utils/auth'
import { createUser, getUserByEmail } from '~/server/db/queries/users'
import { getDB, schema } from '~/server/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, name, password, role = 'student' } = body

  // 驗證輸入
  const emailErrors = validateEmail(email)
  const passwordErrors = validatePassword(password)
  const nameErrors = validateName(name)
  const errors = [...emailErrors, ...passwordErrors, ...nameErrors]

  if (errors.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { errors },
    })
  }

  // 檢查郵箱是否已存在
  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'User with this email already exists',
    })
  }

  // 創建用戶
  const passwordHash = await hashPassword(password)
  const user = await createUser({
    email,
    name,
    passwordHash,
    role: role as 'teacher' | 'student',
  })

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

  // 返回用戶數據（不包含敏感信息）
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

- [ ] **Step 4: 運行測試驗證實現**

```bash
pnpm vitest tests/integration/auth.register.test.ts
```

預期：5 個測試通過

- [ ] **Step 5: 提交**

```bash
git add server/api/auth/register.post.ts tests/integration/auth.register.test.ts
git commit -m "feat: implement user registration with email and password"
```

