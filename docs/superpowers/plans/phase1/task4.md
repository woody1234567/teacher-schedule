## Task 4: 建立用戶資料庫查詢

### 檔案：
- Create: `server/db/queries/users.ts`
- Create: `tests/unit/db/queries/users.test.ts`

- [ ] **Step 1: 寫用戶查詢測試**

建立 `tests/unit/db/queries/users.test.ts`：

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { 
  createUser, 
  getUserByEmail, 
  getUserById,
  updateUser,
  deleteUser 
} from '~/server/db/queries/users'
import { getDB, schema } from '~/server/db'

describe('User Queries', () => {
  const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hash123',
    role: 'student' as const,
  }

  beforeEach(async () => {
    // 清理測試數據
    const db = getDB()
    await db.delete(schema.users).where(eq(schema.users.email, testUser.email))
  })

  afterEach(async () => {
    // 清理測試數據
    const db = getDB()
    await db.delete(schema.users).where(eq(schema.users.email, testUser.email))
  })

  it('should create a user', async () => {
    const user = await createUser(testUser)
    
    expect(user).toBeDefined()
    expect(user.email).toBe(testUser.email)
    expect(user.name).toBe(testUser.name)
    expect(user.role).toBe(testUser.role)
  })

  it('should get user by email', async () => {
    await createUser(testUser)
    const user = await getUserByEmail(testUser.email)
    
    expect(user).toBeDefined()
    expect(user?.email).toBe(testUser.email)
  })

  it('should return null for non-existent email', async () => {
    const user = await getUserByEmail('nonexistent@example.com')
    expect(user).toBeNull()
  })

  it('should get user by id', async () => {
    const created = await createUser(testUser)
    const user = await getUserById(created.id)
    
    expect(user).toBeDefined()
    expect(user?.id).toBe(created.id)
  })

  it('should update user', async () => {
    const created = await createUser(testUser)
    const updated = await updateUser(created.id, { name: 'Updated Name' })
    
    expect(updated.name).toBe('Updated Name')
  })

  it('should delete user', async () => {
    const created = await createUser(testUser)
    await deleteUser(created.id)
    const user = await getUserById(created.id)
    
    expect(user).toBeNull()
  })
})
```

執行測試：
```bash
pnpm vitest tests/unit/db/queries/users.test.ts
```

預期：6 個測試失敗（函數尚未實現）

- [ ] **Step 2: 建立目錄結構**

```bash
mkdir -p server/db/queries
```

- [ ] **Step 3: 實現用戶查詢函數**

建立 `server/db/queries/users.ts`：

```typescript
import { eq } from 'drizzle-orm'
import { getDB, schema } from '../index'
import type { User, NewUser } from '../schema'

export async function createUser(data: Omit<NewUser, 'id'>): Promise<User> {
  const db = getDB()
  const [user] = await db.insert(schema.users).values(data).returning()
  return user
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDB()
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
  return user || null
}

export async function getUserById(id: number): Promise<User | null> {
  const db = getDB()
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
  return user || null
}

export async function updateUser(
  id: number,
  data: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<User> {
  const db = getDB()
  const [user] = await db
    .update(schema.users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, id))
    .returning()
  return user
}

export async function deleteUser(id: number): Promise<void> {
  const db = getDB()
  await db.delete(schema.users).where(eq(schema.users.id, id))
}

export async function getUserByGoogleId(googleId: string): Promise<User | null> {
  const db = getDB()
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.googleId, googleId))
  return user || null
}
```

- [ ] **Step 4: 運行測試驗證實現**

```bash
pnpm vitest tests/unit/db/queries/users.test.ts
```

預期：6 個測試通過

- [ ] **Step 5: 提交**

```bash
git add server/db/queries/ tests/unit/db/queries/
git commit -m "feat: implement user database queries with CRUD operations"
```

