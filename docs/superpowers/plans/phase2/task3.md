## Task 3: 建立行事曆 API 端點

### 檔案：
- Create: `server/api/calendar/index.get.ts`
- Create: `server/api/calendar/index.post.ts`
- Create: `server/api/calendar/[id].put.ts`
- Create: `server/api/calendar/[id].delete.ts`
- Create: `tests/integration/calendar.test.ts`

- [ ] **Step 1: 寫行事曆 API 集成測試**

建立 `tests/integration/calendar.test.ts`：

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { getDB, schema } from '~/server/db'
import { hashPassword } from '~/server/utils/auth'
import { createUser } from '~/server/db/queries/users'

describe('Calendar API', () => {
  let teacherId: number
  let authToken: string

  beforeEach(async () => {
    const db = getDB()
    const teacherEmail = 'teacher-api@example.com'
    await db.delete(schema.users).where(eq(schema.users.email, teacherEmail))

    // 創建測試教師並登錄
    const passwordHash = await hashPassword('TestPassword123!')
    const user = await createUser({
      email: teacherEmail,
      name: 'Teacher API',
      passwordHash,
      role: 'teacher',
    })
    teacherId = user.id

    // 登錄獲取 token
    const loginResponse = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: teacherEmail,
        password: 'TestPassword123!',
      },
    })
    authToken = loginResponse.token
  })

  afterEach(async () => {
    const db = getDB()
    await db.delete(schema.users).where(eq(schema.users.email, 'teacher-api@example.com'))
  })

  it('should get all calendar events for authenticated teacher', async () => {
    const response = await $fetch('/api/calendar', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    })

    expect(Array.isArray(response.events)).toBe(true)
  })

  it('should create a calendar event', async () => {
    const eventData = {
      title: 'Math Class',
      description: 'Advanced Calculus',
      startTime: new Date('2026-05-01T10:00:00').toISOString(),
      endTime: new Date('2026-05-01T11:00:00').toISOString(),
      isAvailable: true,
      maxStudents: 5,
    }

    const response = await $fetch('/api/calendar', {
      method: 'POST',
      body: eventData,
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    })

    expect(response.event.title).toBe('Math Class')
    expect(response.event.teacherId).toBe(teacherId)
  })

  it('should reject unauthenticated calendar creation', async () => {
    const error = await $fetch('/api/calendar', {
      method: 'POST',
      body: {
        title: 'Math Class',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      },
    }).catch(e => e.data)

    expect(error).toBeDefined()
    expect(error.statusCode).toBe(401)
  })

  it('should update a calendar event', async () => {
    // 先創建事件
    const created = await $fetch('/api/calendar', {
      method: 'POST',
      body: {
        title: 'Math Class',
        startTime: new Date('2026-05-01T10:00:00').toISOString(),
        endTime: new Date('2026-05-01T11:00:00').toISOString(),
        isAvailable: true,
        maxStudents: 5,
      },
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    })

    // 更新事件
    const updated = await $fetch(`/api/calendar/${created.event.id}`, {
      method: 'PUT',
      body: {
        title: 'Updated Math Class',
        isAvailable: false,
      },
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    })

    expect(updated.event.title).toBe('Updated Math Class')
    expect(updated.event.isAvailable).toBe(false)
  })

  it('should delete a calendar event', async () => {
    // 先創建事件
    const created = await $fetch('/api/calendar', {
      method: 'POST',
      body: {
        title: 'Math Class',
        startTime: new Date('2026-05-01T10:00:00').toISOString(),
        endTime: new Date('2026-05-01T11:00:00').toISOString(),
        isAvailable: true,
        maxStudents: 5,
      },
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    })

    // 刪除事件
    const response = await $fetch(`/api/calendar/${created.event.id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `auth_token=${authToken}`,
      },
    })

    expect(response.success).toBe(true)
  })
})
```

執行測試：
```bash
pnpm vitest tests/integration/calendar.test.ts
```

預期：5 個測試失敗

- [ ] **Step 2: 建立認證中間件輔助函數**

修改 `server/utils/auth.ts`，添加以下函數：

```typescript
export async function authenticateRequest(event: any) {
  const token = getCookie(event, 'auth_token')
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const { getSessionByToken } = await import('../db/queries/users')
  const session = await getSessionByToken(token)

  if (!session || new Date() > session.sessions.expiresAt) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Session expired',
    })
  }

  return session.users
}
```

- [ ] **Step 3: 實現 GET /api/calendar 端點**

建立 `server/api/calendar/index.get.ts`：

```typescript
import { authenticateRequest } from '~/server/utils/auth'
import { getCalendarEventsByTeacher } from '~/server/db/queries/calendar'

export default defineEventHandler(async (event) => {
  const user = await authenticateRequest(event)

  // 只有教師可以查看自己的行事曆
  if (user.role !== 'teacher') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only teachers can access this endpoint',
    })
  }

  const events = await getCalendarEventsByTeacher(user.id)

  return {
    events,
  }
})
```

- [ ] **Step 4: 實現 POST /api/calendar 端點**

建立 `server/api/calendar/index.post.ts`：

```typescript
import { authenticateRequest } from '~/server/utils/auth'
import { createCalendarEvent } from '~/server/db/queries/calendar'

export default defineEventHandler(async (event) => {
  const user = await authenticateRequest(event)
  const body = await readBody(event)

  // 只有教師可以創建行事曆事件
  if (user.role !== 'teacher') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only teachers can create calendar events',
    })
  }

  // 驗證輸入
  const { title, startTime, endTime, description, isAvailable, maxStudents } = body

  if (!title || !startTime || !endTime) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
      data: {
        errors: [
          ...(!title ? [{ field: 'title', message: 'Title is required' }] : []),
          ...(!startTime ? [{ field: 'startTime', message: 'Start time is required' }] : []),
          ...(!endTime ? [{ field: 'endTime', message: 'End time is required' }] : []),
        ],
      },
    })
  }

  // 驗證時間順序
  const start = new Date(startTime)
  const end = new Date(endTime)

  if (start >= end) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Start time must be before end time',
    })
  }

  const calendarEvent = await createCalendarEvent(user.id, {
    title,
    description: description || null,
    startTime: start,
    endTime: end,
    isAvailable: isAvailable ?? true,
    maxStudents: maxStudents ?? 1,
  })

  return {
    event: calendarEvent,
  }
})
```

- [ ] **Step 5: 實現 PUT /api/calendar/[id] 端點**

建立 `server/api/calendar/[id].put.ts`：

```typescript
import { authenticateRequest } from '~/server/utils/auth'
import { getCalendarEventById, updateCalendarEvent } from '~/server/db/queries/calendar'

export default defineEventHandler(async (event) => {
  const user = await authenticateRequest(event)
  const { id } = event.context.params
  const body = await readBody(event)

  // 只有教師可以更新行事曆事件
  if (user.role !== 'teacher') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only teachers can update calendar events',
    })
  }

  // 驗證事件是否存在且屬於該教師
  const existingEvent = await getCalendarEventById(Number(id))

  if (!existingEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Event not found',
    })
  }

  if (existingEvent.teacherId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You can only update your own events',
    })
  }

  // 驗證時間如果被更新
  if (body.startTime && body.endTime) {
    const start = new Date(body.startTime)
    const end = new Date(body.endTime)

    if (start >= end) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Start time must be before end time',
      })
    }
  }

  const updatedEvent = await updateCalendarEvent(Number(id), {
    title: body.title,
    description: body.description,
    startTime: body.startTime ? new Date(body.startTime) : undefined,
    endTime: body.endTime ? new Date(body.endTime) : undefined,
    isAvailable: body.isAvailable,
    maxStudents: body.maxStudents,
  })

  return {
    event: updatedEvent,
  }
})
```

- [ ] **Step 6: 實現 DELETE /api/calendar/[id] 端點**

建立 `server/api/calendar/[id].delete.ts`：

```typescript
import { authenticateRequest } from '~/server/utils/auth'
import { getCalendarEventById, deleteCalendarEvent } from '~/server/db/queries/calendar'

export default defineEventHandler(async (event) => {
  const user = await authenticateRequest(event)
  const { id } = event.context.params

  // 只有教師可以刪除行事曆事件
  if (user.role !== 'teacher') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only teachers can delete calendar events',
    })
  }

  // 驗證事件是否存在且屬於該教師
  const existingEvent = await getCalendarEventById(Number(id))

  if (!existingEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Event not found',
    })
  }

  if (existingEvent.teacherId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You can only delete your own events',
    })
  }

  await deleteCalendarEvent(Number(id))

  return {
    success: true,
    message: 'Event deleted successfully',
  }
})
```

- [ ] **Step 7: 運行測試驗證**

```bash
pnpm vitest tests/integration/calendar.test.ts
```

預期：5 個測試通過

- [ ] **Step 8: 提交**

```bash
git add server/api/calendar/ tests/integration/calendar.test.ts
git commit -m "feat: implement calendar CRUD API endpoints with authentication"
```

