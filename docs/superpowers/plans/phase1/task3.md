## Task 3: 建立密碼工具函數和測試

### 檔案：
- Create: `server/utils/auth.ts`
- Create: `tests/unit/auth/password.test.ts`

- [ ] **Step 1: 寫密碼加密測試（TDD）**

建立 `tests/unit/auth/password.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '~/server/utils/auth'

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
```

執行測試：
```bash
pnpm vitest tests/unit/auth/password.test.ts
```

預期：4 個測試失敗（函數尚未實現）

- [ ] **Step 2: 安裝密碼雜湊庫**

```bash
pnpm add argon2
```

- [ ] **Step 3: 實現密碼工具函數**

建立 `server/utils/auth.ts`：

```typescript
import { hash, verify } from 'argon2'

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, {
    type: 2, // Argon2id
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  })
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await verify(hash, password)
}

export function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
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
  } else if (!emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' })
  }
  
  return errors
}

export function validatePassword(password: string): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' })
  } else if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' })
  } else if (!/[A-Z]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' })
  } else if (!/[0-9]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one number' })
  }
  
  return errors
}

export function validateName(name: string): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!name || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' })
  } else if (name.length > 255) {
    errors.push({ field: 'name', message: 'Name must be less than 255 characters' })
  }
  
  return errors
}
```

- [ ] **Step 4: 運行測試驗證實現**

```bash
pnpm vitest tests/unit/auth/password.test.ts
```

預期：4 個測試通過

- [ ] **Step 5: 提交**

```bash
git add server/utils/auth.ts tests/unit/auth/password.test.ts
git commit -m "feat: implement password hashing with Argon2 and validation"
```

