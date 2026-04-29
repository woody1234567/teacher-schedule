# 第二階段：行事曆管理系統 - 詳細計畫

> **對於代理工作者：** 使用 superpowers:subagent-driven-development 或 superpowers:executing-plans 按任務逐步實施此計畫。

**目標：** 實現教師行事曆的完整 CRUD 操作，包括建立、編輯、刪除課程時間段，標記可用時間供學生預約。

**架構：** CalendarEvents 表儲存教師的所有課程時段。API 端點提供 CRUD 操作。前端提供月視圖/週視圖和新增/編輯事件的表單。

**技術堆棧：** PostgreSQL, Drizzle ORM, Nuxt 4, Vue 3, @nuxt/ui, Vitest

---

## 檔案結構

**新建檔案：**
- `server/db/schema.ts` (修改) - 添加 CalendarEvents 表
- `server/db/queries/calendar.ts` - 行事曆資料庫查詢
- `server/api/calendar/index.get.ts` - 獲取行事曆
- `server/api/calendar/index.post.ts` - 新增事件
- `server/api/calendar/[id].put.ts` - 編輯事件
- `server/api/calendar/[id].delete.ts` - 刪除事件
- `app/components/calendar/CalendarView.vue` - 行事曆視圖
- `app/components/calendar/EventForm.vue` - 事件表單
- `app/components/calendar/EventCard.vue` - 事件卡片
- `app/pages/teacher/calendar.vue` - 教師行事曆頁面
- `app/composables/useCalendar.ts` - 行事曆組合函數
- `tests/unit/calendar/calendar.test.ts` - 行事曆查詢測試
- `tests/integration/calendar.test.ts` - 行事曆 API 集成測試

**修改檔案：**
- `server/db/schema.ts` - 添加 CalendarEvents 表和關係

---

## Task 1: 添加 CalendarEvents 資料庫表

### 檔案：
- Modify: `server/db/schema.ts`

- [ ] **Step 1: 添加 CalendarEvents 表定義**

修改 `server/db/schema.ts`，在末尾添加：

```typescript
// 行事曆事件表
export const calendarEvents = pgTable('calendar_events', {
  id: serial('id').primaryKey(),
  teacherId: serial('teacher_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  maxStudents: integer('max_students').default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 關係定義
export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  teacher: one(users, {
    fields: [calendarEvents.teacherId],
    references: [users.id],
  }),
}))

export const usersCalendarRelations = relations(users, ({ many }) => ({
  calendarEvents: many(calendarEvents),
}))

// 類型導出
export type CalendarEvent = typeof calendarEvents.$inferSelect
export type NewCalendarEvent = typeof calendarEvents.$inferInsert
```

- [ ] **Step 2: 生成資料庫遷移**

```bash
pnpm db:migrate
```

驗證 PostgreSQL 中已創建 `calendar_events` 表。

- [ ] **Step 3: 提交**

```bash
git add server/db/schema.ts
git commit -m "feat: add CalendarEvents table schema"
```

---

## Task 2: 建立行事曆資料庫查詢

### 檔案：
- Create: `server/db/queries/calendar.ts`
- Create: `tests/unit/calendar/calendar.test.ts`

- [ ] **Step 1: 寫行事曆查詢測試**

建立 `tests/unit/calendar/calendar.test.ts`：

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq, and } from 'drizzle-orm'
import {
  createCalendarEvent,
  getCalendarEventById,
  getCalendarEventsByTeacher,
  updateCalendarEvent,
  deleteCalendarEvent,
  getAvailableSlots,
} from '~/server/db/queries/calendar'
import { getDB, schema } from '~/server/db'
import { hashPassword } from '~/server/utils/auth'
import { createUser } from '~/server/db/queries/users'

describe('Calendar Queries', () => {
  let teacherId: number
  const teacherUser = {
    email: 'teacher-calendar@example.com',
    name: 'Calendar Teacher',
    passwordHash: 'hash123',
    role: 'teacher' as const,
  }

  const eventData = {
    title: 'Math Class',
    description: 'Advanced Calculus',
    startTime: new Date('2026-05-01T10:00:00'),
    endTime: new Date('2026-05-01T11:00:00'),
    isAvailable: true,
    maxStudents: 5,
  }

  beforeEach(async () => {
    const db = getDB()
    // 清理測試數據
    await db.delete(schema.users).where(eq(schema.users.email, teacherUser.email))
    
    // 創建測試教師
    const passwordHash = await hashPassword(teacherUser.passwordHash)
    const user = await createUser({ ...teacherUser, passwordHash })
    teacherId = user.id
  })

  afterEach(async () => {
    const db = getDB()
    await db.delete(schema.users).where(eq(schema.users.email, teacherUser.email))
  })

  it('should create a calendar event', async () => {
    const event = await createCalendarEvent(teacherId, eventData)
    
    expect(event).toBeDefined()
    expect(event.title).toBe(eventData.title)
    expect(event.teacherId).toBe(teacherId)
    expect(event.isAvailable).toBe(true)
  })

  it('should get calendar event by id', async () => {
    const created = await createCalendarEvent(teacherId, eventData)
    const event = await getCalendarEventById(created.id)
    
    expect(event).toBeDefined()
    expect(event?.id).toBe(created.id)
  })

  it('should get all events for a teacher', async () => {
    await createCalendarEvent(teacherId, eventData)
    await createCalendarEvent(teacherId, {
      ...eventData,
      title: 'Physics Class',
      startTime: new Date('2026-05-02T10:00:00'),
      endTime: new Date('2026-05-02T11:00:00'),
    })
    
    const events = await getCalendarEventsByTeacher(teacherId)
    
    expect(events).toHaveLength(2)
  })

  it('should update calendar event', async () => {
    const created = await createCalendarEvent(teacherId, eventData)
    const updated = await updateCalendarEvent(created.id, {
      title: 'Updated Math Class',
      isAvailable: false,
    })
    
    expect(updated.title).toBe('Updated Math Class')
    expect(updated.isAvailable).toBe(false)
  })

  it('should delete calendar event', async () => {
    const created = await createCalendarEvent(teacherId, eventData)
    await deleteCalendarEvent(created.id)
    const event = await getCalendarEventById(created.id)
    
    expect(event).toBeNull()
  })

  it('should get available slots for a teacher', async () => {
    await createCalendarEvent(teacherId, eventData)
    await createCalendarEvent(teacherId, {
      ...eventData,
      title: 'Physics Class',
      startTime: new Date('2026-05-02T10:00:00'),
      endTime: new Date('2026-05-02T11:00:00'),
      isAvailable: false,
    })
    
    const available = await getAvailableSlots(teacherId)
    
    expect(available).toHaveLength(1)
    expect(available[0].title).toBe('Math Class')
  })
})
```

執行測試：
```bash
pnpm vitest tests/unit/calendar/calendar.test.ts
```

預期：6 個測試失敗

- [ ] **Step 2: 實現行事曆查詢函數**

建立 `server/db/queries/calendar.ts`：

```typescript
import { eq, and, gte, lte } from 'drizzle-orm'
import { getDB, schema } from '../index'
import type { CalendarEvent, NewCalendarEvent } from '../schema'

export async function createCalendarEvent(
  teacherId: number,
  data: Omit<NewCalendarEvent, 'id' | 'teacherId'>
): Promise<CalendarEvent> {
  const db = getDB()
  const [event] = await db
    .insert(schema.calendarEvents)
    .values({
      ...data,
      teacherId,
    })
    .returning()
  return event
}

export async function getCalendarEventById(id: number): Promise<CalendarEvent | null> {
  const db = getDB()
  const [event] = await db
    .select()
    .from(schema.calendarEvents)
    .where(eq(schema.calendarEvents.id, id))
  return event || null
}

export async function getCalendarEventsByTeacher(teacherId: number): Promise<CalendarEvent[]> {
  const db = getDB()
  return await db
    .select()
    .from(schema.calendarEvents)
    .where(eq(schema.calendarEvents.teacherId, teacherId))
}

export async function getCalendarEventsByTeacherAndDate(
  teacherId: number,
  date: Date
): Promise<CalendarEvent[]> {
  const db = getDB()
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  return await db
    .select()
    .from(schema.calendarEvents)
    .where(
      and(
        eq(schema.calendarEvents.teacherId, teacherId),
        gte(schema.calendarEvents.startTime, dayStart),
        lte(schema.calendarEvents.endTime, dayEnd)
      )
    )
}

export async function updateCalendarEvent(
  id: number,
  data: Partial<Omit<CalendarEvent, 'id' | 'teacherId' | 'createdAt'>>
): Promise<CalendarEvent> {
  const db = getDB()
  const [event] = await db
    .update(schema.calendarEvents)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.calendarEvents.id, id))
    .returning()
  return event
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  const db = getDB()
  await db.delete(schema.calendarEvents).where(eq(schema.calendarEvents.id, id))
}

export async function getAvailableSlots(teacherId: number): Promise<CalendarEvent[]> {
  const db = getDB()
  return await db
    .select()
    .from(schema.calendarEvents)
    .where(
      and(
        eq(schema.calendarEvents.teacherId, teacherId),
        eq(schema.calendarEvents.isAvailable, true)
      )
    )
}

export async function getAvailableSlotsInDateRange(
  teacherId: number,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const db = getDB()
  return await db
    .select()
    .from(schema.calendarEvents)
    .where(
      and(
        eq(schema.calendarEvents.teacherId, teacherId),
        eq(schema.calendarEvents.isAvailable, true),
        gte(schema.calendarEvents.startTime, startDate),
        lte(schema.calendarEvents.endTime, endDate)
      )
    )
}
```

- [ ] **Step 3: 運行測試驗證**

```bash
pnpm vitest tests/unit/calendar/calendar.test.ts
```

預期：6 個測試通過

- [ ] **Step 4: 提交**

```bash
git add server/db/queries/calendar.ts tests/unit/calendar/
git commit -m "feat: implement calendar database queries with CRUD operations"
```

---

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

---

## Task 4: 建立行事曆組合函數

### 檔案：
- Create: `app/composables/useCalendar.ts`

- [ ] **Step 1: 實現行事曆組合函數**

建立 `app/composables/useCalendar.ts`：

```typescript
import { ref, computed } from 'vue'

export interface CalendarEvent {
  id: number
  title: string
  description?: string
  startTime: string
  endTime: string
  isAvailable: boolean
  maxStudents: number
  createdAt: string
  updatedAt: string
}

export interface CalendarEventInput {
  title: string
  description?: string
  startTime: string
  endTime: string
  isAvailable?: boolean
  maxStudents?: number
}

export const useCalendar = () => {
  const events = ref<CalendarEvent[]>([])
  const loading = ref(false)
  const error = ref('')
  const selectedEvent = ref<CalendarEvent | null>(null)

  const fetchEvents = async () => {
    loading.value = true
    error.value = ''

    try {
      const response = await $fetch('/api/calendar', {
        method: 'GET',
      })
      events.value = response.events
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch events'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createEvent = async (data: CalendarEventInput) => {
    loading.value = true
    error.value = ''

    try {
      const response = await $fetch('/api/calendar', {
        method: 'POST',
        body: data,
      })
      events.value.push(response.event)
      return response.event
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to create event'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateEvent = async (id: number, data: Partial<CalendarEventInput>) => {
    loading.value = true
    error.value = ''

    try {
      const response = await $fetch(`/api/calendar/${id}`, {
        method: 'PUT',
        body: data,
      })
      const index = events.value.findIndex(e => e.id === id)
      if (index !== -1) {
        events.value[index] = response.event
      }
      return response.event
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to update event'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteEvent = async (id: number) => {
    loading.value = true
    error.value = ''

    try {
      await $fetch(`/api/calendar/${id}`, {
        method: 'DELETE',
      })
      events.value = events.value.filter(e => e.id !== id)
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to delete event'
      throw err
    } finally {
      loading.value = false
    }
  }

  const upcomingEvents = computed(() => {
    const now = new Date()
    return events.value.filter(e => new Date(e.startTime) > now).sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    })
  })

  const availableEvents = computed(() => {
    return events.value.filter(e => e.isAvailable)
  })

  const getEventsByDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.value.filter(e => e.startTime.startsWith(dateStr))
  }

  return {
    events,
    loading,
    error,
    selectedEvent,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    upcomingEvents,
    availableEvents,
    getEventsByDate,
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add app/composables/useCalendar.ts
git commit -m "feat: add calendar composable with event management"
```

---

## Task 5: 建立行事曆前端組件

### 檔案：
- Create: `app/components/calendar/CalendarView.vue`
- Create: `app/components/calendar/EventForm.vue`
- Create: `app/components/calendar/EventCard.vue`

- [ ] **Step 1: 建立事件卡片組件**

建立 `app/components/calendar/EventCard.vue`：

```vue
<template>
  <div class="bg-white rounded-lg shadow p-4 border-l-4" :class="borderColorClass">
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <h3 class="font-semibold text-lg">{{ event.title }}</h3>
        <p v-if="event.description" class="text-gray-600 text-sm mt-1">{{ event.description }}</p>
        
        <div class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <span>📅 {{ formatDate(event.startTime) }}</span>
          <span>🕐 {{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}</span>
        </div>

        <div class="mt-2 flex gap-2">
          <span v-if="event.isAvailable" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            Available
          </span>
          <span v-else class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
            Booked
          </span>
          <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            Max {{ event.maxStudents }} student{{ event.maxStudents > 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <div v-if="showActions" class="flex gap-2 ml-4">
        <button
          @click="$emit('edit')"
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Edit
        </button>
        <button
          @click="$emit('delete')"
          class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~/composables/useCalendar'

defineProps<{
  event: CalendarEvent
  showActions?: boolean
}>()

defineEmits(['edit', 'delete', 'book'])

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}

const borderColorClass = computed(() => {
  if (props.event.isAvailable) {
    return 'border-green-400'
  }
  return 'border-red-400'
})
</script>
```

- [ ] **Step 2: 建立事件表單組件**

建立 `app/components/calendar/EventForm.vue`：

```vue
<template>
  <form @submit.prevent="handleSubmit" class="bg-white rounded-lg shadow p-6 space-y-4">
    <div>
      <label for="title" class="block text-sm font-medium mb-1">Event Title *</label>
      <input
        v-model="form.title"
        id="title"
        type="text"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="e.g., Math Class"
      />
    </div>

    <div>
      <label for="description" class="block text-sm font-medium mb-1">Description</label>
      <textarea
        v-model="form.description"
        id="description"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Event description..."
        rows="3"
      ></textarea>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="startTime" class="block text-sm font-medium mb-1">Start Time *</label>
        <input
          v-model="form.startTime"
          id="startTime"
          type="datetime-local"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="endTime" class="block text-sm font-medium mb-1">End Time *</label>
        <input
          v-model="form.endTime"
          id="endTime"
          type="datetime-local"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="maxStudents" class="block text-sm font-medium mb-1">Max Students</label>
        <input
          v-model.number="form.maxStudents"
          id="maxStudents"
          type="number"
          min="1"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Available for Booking</label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.isAvailable"
            type="checkbox"
            class="w-4 h-4"
          />
          <span class="text-sm">Mark as available</span>
        </label>
      </div>
    </div>

    <div v-if="error" class="p-3 bg-red-100 text-red-700 rounded-md text-sm">
      {{ error }}
    </div>

    <div class="flex justify-end gap-2">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="loading"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {{ loading ? 'Saving...' : 'Save Event' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CalendarEvent, CalendarEventInput } from '~/composables/useCalendar'

const props = defineProps<{
  event?: CalendarEvent
  loading?: boolean
}>()

const emit = defineEmits(['submit', 'cancel'])

const form = ref<CalendarEventInput>({
  title: props.event?.title || '',
  description: props.event?.description || '',
  startTime: props.event?.startTime || '',
  endTime: props.event?.endTime || '',
  isAvailable: props.event?.isAvailable ?? true,
  maxStudents: props.event?.maxStudents || 1,
})

const error = ref('')

const handleSubmit = () => {
  if (!form.value.title.trim()) {
    error.value = 'Title is required'
    return
  }

  if (!form.value.startTime || !form.value.endTime) {
    error.value = 'Start and end times are required'
    return
  }

  const start = new Date(form.value.startTime)
  const end = new Date(form.value.endTime)

  if (start >= end) {
    error.value = 'Start time must be before end time'
    return
  }

  emit('submit', form.value)
}
</script>
```

- [ ] **Step 3: 建立行事曆視圖組件**

建立 `app/components/calendar/CalendarView.vue`：

```vue
<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">{{ monthYearLabel }}</h2>
      <div class="flex gap-2">
        <button
          @click="previousMonth"
          class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Previous
        </button>
        <button
          @click="nextMonth"
          class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Next →
        </button>
        <button
          @click="today"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Today
        </button>
      </div>
    </div>

    <!-- Week Days Header -->
    <div class="grid grid-cols-7 gap-2 mb-2">
      <div
        v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
        :key="day"
        class="text-center font-semibold py-2"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7 gap-2">
      <div
        v-for="day in calendarDays"
        :key="day.date.toISOString()"
        :class="getDayClass(day)"
        class="min-h-24 p-2 rounded border cursor-pointer hover:bg-blue-50"
        @click="selectDate(day.date)"
      >
        <div class="font-semibold text-sm mb-1">{{ day.date.getDate() }}</div>
        <div v-if="day.events.length > 0" class="space-y-1">
          <div
            v-for="event in day.events.slice(0, 2)"
            :key="event.id"
            class="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded truncate"
          >
            {{ event.title }}
          </div>
          <div v-if="day.events.length > 2" class="text-xs text-gray-500">
            +{{ day.events.length - 2 }} more
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Date Events -->
    <div v-if="selectedDate" class="mt-6">
      <h3 class="text-lg font-semibold mb-4">
        Events on {{ selectedDate.toLocaleDateString('zh-TW') }}
      </h3>
      <div v-if="selectedDateEvents.length === 0" class="text-gray-500">
        No events on this day
      </div>
      <div v-else class="space-y-3">
        <EventCard
          v-for="event in selectedDateEvents"
          :key="event.id"
          :event="event"
          :show-actions="showActions"
          @edit="$emit('edit', event)"
          @delete="$emit('delete', event.id)"
          @book="$emit('book', event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CalendarEvent } from '~/composables/useCalendar'

defineProps<{
  events: CalendarEvent[]
  showActions?: boolean
}>()

defineEmits(['edit', 'delete', 'book', 'dateSelect'])

const currentDate = ref(new Date())
const selectedDate = ref<Date | null>(null)

const monthYearLabel = computed(() => {
  return currentDate.value.toLocaleDateString('zh-TW', { month: 'long', year: 'numeric' })
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const days = []

  // 上月的尾部
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({ date, isCurrentMonth: false, events: [] })
  }

  // 當月
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateStr = date.toISOString().split('T')[0]
    const events = props.events.filter(e => e.startTime.startsWith(dateStr))
    days.push({ date, isCurrentMonth: true, events })
  }

  // 下月的開頭
  const remainingDays = 42 - days.length // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push({ date, isCurrentMonth: false, events: [] })
  }

  return days
})

const selectedDateEvents = computed(() => {
  if (!selectedDate.value) return []
  const dateStr = selectedDate.value.toISOString().split('T')[0]
  return props.events.filter(e => e.startTime.startsWith(dateStr))
})

const getDayClass = (day: any) => {
  const classes = []
  if (!day.isCurrentMonth) classes.push('bg-gray-50 text-gray-400')
  if (selectedDate.value && day.date.toDateString() === selectedDate.value.toDateString()) {
    classes.push('bg-blue-200 border-blue-400')
  }
  return classes.join(' ')
}

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1)
}

const today = () => {
  currentDate.value = new Date()
  selectDate(new Date())
}

const selectDate = (date: Date) => {
  selectedDate.value = new Date(date)
}
</script>
```

- [ ] **Step 4: 提交**

```bash
git add app/components/calendar/
git commit -m "feat: add calendar UI components (view, form, card)"
```

---

## Task 6: 建立教師行事曆頁面

### 檔案：
- Create: `app/pages/teacher/calendar.vue`

- [ ] **Step 1: 建立教師行事曆頁面**

建立 `app/pages/teacher/calendar.vue`：

```vue
<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-7xl mx-auto px-4">
      <h1 class="text-3xl font-bold mb-8">My Calendar</h1>

      <div class="grid grid-cols-3 gap-6">
        <!-- Calendar View -->
        <div class="col-span-2">
          <CalendarView
            :events="calendar.events"
            :show-actions="true"
            @edit="startEdit"
            @delete="deleteEvent"
          />
        </div>

        <!-- Event Form Sidebar -->
        <div class="col-span-1">
          <div class="sticky top-8">
            <div v-if="!editingEvent && !showForm" class="bg-white rounded-lg shadow p-6">
              <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
              <button
                @click="showForm = true"
                class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
              >
                ➕ Add New Event
              </button>

              <h3 class="font-semibold mt-6 mb-3">Upcoming Events</h3>
              <div v-if="calendar.upcomingEvents.length === 0" class="text-gray-500 text-sm">
                No upcoming events
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="event in calendar.upcomingEvents.slice(0, 5)"
                  :key="event.id"
                  class="text-sm p-2 bg-gray-50 rounded"
                >
                  <div class="font-medium">{{ event.title }}</div>
                  <div class="text-xs text-gray-500">
                    {{ formatDate(event.startTime) }} {{ formatTime(event.startTime) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Form for Creating/Editing -->
            <div v-if="showForm || editingEvent" class="bg-white rounded-lg shadow p-6">
              <h2 class="text-lg font-semibold mb-4">
                {{ editingEvent ? 'Edit Event' : 'New Event' }}
              </h2>
              <EventForm
                :event="editingEvent"
                :loading="calendar.loading"
                @submit="saveEvent"
                @cancel="cancelEdit"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCalendar } from '~/composables/useCalendar'
import type { CalendarEvent, CalendarEventInput } from '~/composables/useCalendar'

definePageMeta({
  middleware: 'auth',
})

const calendar = useCalendar()
const showForm = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)

onMounted(async () => {
  await calendar.fetchEvents()
})

const startEdit = (event: CalendarEvent) => {
  editingEvent.value = event
  showForm.value = false
}

const cancelEdit = () => {
  editingEvent.value = null
  showForm.value = false
}

const saveEvent = async (data: CalendarEventInput) => {
  try {
    if (editingEvent.value) {
      await calendar.updateEvent(editingEvent.value.id, data)
    } else {
      await calendar.createEvent(data)
    }
    cancelEdit()
  } catch (err) {
    // Error handled by composable
  }
}

const deleteEvent = async (id: number) => {
  if (confirm('Are you sure you want to delete this event?')) {
    try {
      await calendar.deleteEvent(id)
    } catch (err) {
      // Error handled by composable
    }
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}
</script>
```

- [ ] **Step 2: 提交**

```bash
git add app/pages/teacher/calendar.vue
git commit -m "feat: add teacher calendar management page"
```

---

## Task 7: 建立學生可用時間查看 API 和頁面

### 檔案：
- Create: `server/api/calendar/teachers/[teacherId]/available.get.ts`
- Create: `app/pages/student/teachers/[id].vue`
- Create: `tests/integration/calendar.available.test.ts`

- [ ] **Step 1: 建立獲取教師可用時間 API**

建立 `server/api/calendar/teachers/[teacherId]/available.get.ts`：

```typescript
import { getUserById } from '~/server/db/queries/users'
import { getAvailableSlots } from '~/server/db/queries/calendar'

export default defineEventHandler(async (event) => {
  const { teacherId } = event.context.params

  // 驗證教師存在
  const teacher = await getUserById(Number(teacherId))

  if (!teacher || teacher.role !== 'teacher') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Teacher not found',
    })
  }

  // 獲取該教師的可用時間段
  const availableSlots = await getAvailableSlots(Number(teacherId))

  return {
    teacher: {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      avatar: teacher.avatar,
    },
    availableSlots,
  }
})
```

- [ ] **Step 2: 建立學生查看教師時間頁面**

建立 `app/pages/student/teachers/[id].vue`：

```vue
<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <NuxtLink to="/student/teachers" class="text-blue-600 hover:underline mb-4">
        ← Back to Teachers
      </NuxtLink>

      <div v-if="loading" class="text-center py-8">
        <p>Loading teacher information...</p>
      </div>

      <div v-else-if="teacher">
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h1 class="text-3xl font-bold">{{ teacher.name }}</h1>
          <p class="text-gray-600">{{ teacher.email }}</p>
        </div>

        <h2 class="text-2xl font-bold mb-4">Available Time Slots</h2>

        <div v-if="availableSlots.length === 0" class="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          This teacher currently has no available time slots for booking.
        </div>

        <div v-else class="grid gap-4">
          <EventCard
            v-for="slot in availableSlots"
            :key="slot.id"
            :event="slot"
            :show-actions="false"
            @book="bookSlot(slot)"
          >
            <template #actions>
              <button
                @click="bookSlot(slot)"
                class="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Request Booking
              </button>
            </template>
          </EventCard>
        </div>
      </div>

      <div v-else class="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Teacher not found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { CalendarEvent } from '~/composables/useCalendar'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const teacherId = route.params.id

const teacher = ref(null)
const availableSlots = ref<CalendarEvent[]>([])
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await $fetch(`/api/calendar/teachers/${teacherId}/available`)
    teacher.value = response.teacher
    availableSlots.value = response.availableSlots
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to load teacher information'
  } finally {
    loading.value = false
  }
}

const bookSlot = (slot: CalendarEvent) => {
  // 在第三階段實現
  alert(`Booking for ${slot.title} - Feature coming in Phase 3`)
}
</script>
```

- [ ] **Step 3: 寫集成測試**

建立 `tests/integration/calendar.available.test.ts`：

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { getDB, schema } from '~/server/db'
import { hashPassword } from '~/server/utils/auth'
import { createUser } from '~/server/db/queries/users'
import { createCalendarEvent } from '~/server/db/queries/calendar'

describe('Available Calendar Slots API', () => {
  let teacherId: number

  beforeEach(async () => {
    const db = getDB()
    const teacherEmail = 'teacher-available@example.com'
    await db.delete(schema.users).where(eq(schema.users.email, teacherEmail))

    // 創建教師和事件
    const passwordHash = await hashPassword('TestPassword123!')
    const user = await createUser({
      email: teacherEmail,
      name: 'Available Teacher',
      passwordHash,
      role: 'teacher',
    })
    teacherId = user.id

    // 創建一些可用的時間段
    await createCalendarEvent(teacherId, {
      title: 'Available Slot 1',
      startTime: new Date('2026-05-01T10:00:00'),
      endTime: new Date('2026-05-01T11:00:00'),
      isAvailable: true,
      maxStudents: 5,
    })

    await createCalendarEvent(teacherId, {
      title: 'Booked Slot',
      startTime: new Date('2026-05-02T10:00:00'),
      endTime: new Date('2026-05-02T11:00:00'),
      isAvailable: false,
      maxStudents: 5,
    })
  })

  afterEach(async () => {
    const db = getDB()
    await db.delete(schema.users).where(eq(schema.users.email, 'teacher-available@example.com'))
  })

  it('should get available slots for a teacher', async () => {
    const response = await $fetch(`/api/calendar/teachers/${teacherId}/available`)

    expect(response.teacher).toBeDefined()
    expect(response.teacher.id).toBe(teacherId)
    expect(Array.isArray(response.availableSlots)).toBe(true)
    expect(response.availableSlots).toHaveLength(1)
    expect(response.availableSlots[0].title).toBe('Available Slot 1')
  })

  it('should return 404 for non-existent teacher', async () => {
    const error = await $fetch('/api/calendar/teachers/99999/available').catch(e => e.data)

    expect(error).toBeDefined()
    expect(error.statusCode).toBe(404)
  })
})
```

執行測試：
```bash
pnpm vitest tests/integration/calendar.available.test.ts
```

預期：2 個測試通過

- [ ] **Step 4: 提交**

```bash
git add server/api/calendar/teachers/ app/pages/student/teachers/ tests/integration/calendar.available.test.ts
git commit -m "feat: add student view of available teacher time slots"
```

---

## 第二階段完成檢查清單

- [ ] CalendarEvents 表創建和遷移
- [ ] 行事曆資料庫查詢實現
- [ ] 行事曆 CRUD API 端點完成
- [ ] 行事曆組合函數完成
- [ ] 行事曆視圖組件完成
- [ ] 事件表單和卡片組件完成
- [ ] 教師行事曆管理頁面完成
- [ ] 學生查看可用時間 API 完成
- [ ] 學生查看教師時間頁面完成
- [ ] 所有單元測試通過
- [ ] 所有集成測試通過
- [ ] 手動測試流程驗證完成

---

## 下一步

第二階段完成後，準備進入 **第三階段：預約系統 + 實時更新**

在第三階段中，我們將：
1. 建立 BookingRequests 和 Bookings 表
2. 實現預約 API 端點（請求、審核、取消）
3. 建立學生端預約請求 UI
4. 建立教師端審核 UI
5. 實現實時更新（WebSocket / Nitro 伺服器事件）
6. 實現預約通知系統

準備好時，告知進行第三階段計畫展開。
