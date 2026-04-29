## Task 2: 建立資料庫連接和用戶表結構

### 檔案：
- Create: `server/db/schema.ts`
- Create: `server/db/index.ts`

- [ ] **Step 1: 定義資料庫表結構**

建立 `server/db/schema.ts`：

```typescript
import { pgTable, text, varchar, timestamp, boolean, serial, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// 枚舉定義用戶角色
export const userRoleEnum = pgEnum('user_role', ['teacher', 'student'])

// 用戶表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash'),
  googleId: text('google_id').unique(),
  role: userRoleEnum('role').default('student').notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 會話表（Better-Auth 使用）
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: serial('user_id').references(() => users.id).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 關係定義
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

// 類型導出
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
```

- [ ] **Step 2: 建立資料庫連接**

建立 `server/db/index.ts`：

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let db: ReturnType<typeof drizzle> | null = null

export function getDB() {
  if (!db) {
    const config = useRuntimeConfig()
    const client = postgres(config.databaseUrl, { prepare: false })
    db = drizzle(client, { schema })
  }
  return db
}

export { schema }
```

- [ ] **Step 3: 測試資料庫連接**

建立 `tests/unit/db/connection.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { getDB } from '~/server/db'

describe('Database Connection', () => {
  it('should establish database connection', async () => {
    const db = getDB()
    expect(db).toBeDefined()
  })

  it('should have users table schema', () => {
    const db = getDB()
    const userSchema = db._.schema?.users
    expect(userSchema).toBeDefined()
  })
})
```

執行測試：
```bash
pnpm vitest tests/unit/db/connection.test.ts
```

預期：通過（資料庫連接正常）

- [ ] **Step 4: 執行資料庫遷移**

建立資料庫遷移文件並執行：

```bash
pnpm db:migrate
```

驗證 PostgreSQL 中已創建 `users` 和 `sessions` 表。

- [ ] **Step 5: 提交**

```bash
git add server/db/ tests/unit/db/
git commit -m "feat: setup database schema and connection with Drizzle ORM"
```

