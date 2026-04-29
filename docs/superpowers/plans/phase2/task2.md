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

