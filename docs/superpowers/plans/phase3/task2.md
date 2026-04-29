## Task 2: 建立預約資料庫查詢

### 檔案：
- Create: `server/db/queries/bookings.ts`
- Create: `tests/unit/bookings/bookings.test.ts`

- [ ] **Step 1: 寫預約查詢測試**

建立 `tests/unit/bookings/bookings.test.ts`：

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import {
  createBookingRequest,
  getBookingRequestById,
  getTeacherBookingRequests,
  getStudentBookingRequests,
  updateBookingRequestStatus,
  createBooking,
  getStudentBookings,
  getTeacherBookings,
  cancelBooking,
} from '~/server/db/queries/bookings'
import { getDB, schema } from '~/server/db'
import { hashPassword } from '~/server/utils/auth'
import { createUser } from '~/server/db/queries/users'
import { createCalendarEvent } from '~/server/db/queries/calendar'

describe('Booking Queries', () => {
  let studentId: number
  let teacherId: number
  let eventId: number

  const studentUser = {
    email: 'student-booking@example.com',
    name: 'Booking Student',
    passwordHash: 'hash123',
    role: 'student' as const,
  }

  const teacherUser = {
    email: 'teacher-booking@example.com',
    name: 'Booking Teacher',
    passwordHash: 'hash123',
    role: 'teacher' as const,
  }

  beforeEach(async () => {
    const db = getDB()
    // 清理測試數據
    await db.delete(schema.users).where(eq(schema.users.email, studentUser.email))
    await db.delete(schema.users).where(eq(schema.users.email, teacherUser.email))

    // 創建測試用戶
    const passwordHash = await hashPassword('password123')
    const student = await createUser({ ...studentUser, passwordHash })
    const teacher = await createUser({ ...teacherUser, passwordHash })
    studentId = student.id
    teacherId = teacher.id

    // 創建行事曆事件
    const event = await createCalendarEvent(teacherId, {
      title: 'Test Class',
      startTime: new Date('2026-05-01T10:00:00'),
      endTime: new Date('2026-05-01T11:00:00'),
      isAvailable: true,
      maxStudents: 5,
    })
    eventId = event.id
  })

  afterEach(async () => {
    const db = getDB()
    await db.delete(schema.users).where(eq(schema.users.email, studentUser.email))
    await db.delete(schema.users).where(eq(schema.users.email, teacherUser.email))
  })

  it('should create a booking request', async () => {
    const request = await createBookingRequest(studentId, teacherId, eventId, 'I would like to book this class')

    expect(request).toBeDefined()
    expect(request.studentId).toBe(studentId)
    expect(request.teacherId).toBe(teacherId)
    expect(request.status).toBe('pending')
  })

  it('should get booking request by id', async () => {
    const created = await createBookingRequest(studentId, teacherId, eventId, 'Request')
    const request = await getBookingRequestById(created.id)

    expect(request).toBeDefined()
    expect(request?.id).toBe(created.id)
  })

  it('should get all booking requests for a teacher', async () => {
    await createBookingRequest(studentId, teacherId, eventId, 'Request 1')
    const requests = await getTeacherBookingRequests(teacherId)

    expect(requests.length).toBeGreaterThan(0)
  })

  it('should get all booking requests from a student', async () => {
    await createBookingRequest(studentId, teacherId, eventId, 'Request')
    const requests = await getStudentBookingRequests(studentId)

    expect(requests.length).toBeGreaterThan(0)
  })

  it('should update booking request status', async () => {
    const created = await createBookingRequest(studentId, teacherId, eventId, 'Request')
    const updated = await updateBookingRequestStatus(created.id, 'approved')

    expect(updated.status).toBe('approved')
    expect(updated.respondedAt).toBeDefined()
  })

  it('should create a booking from approved request', async () => {
    const request = await createBookingRequest(studentId, teacherId, eventId, 'Request')
    const booking = await createBooking(studentId, teacherId, eventId, request.id)

    expect(booking).toBeDefined()
    expect(booking.studentId).toBe(studentId)
    expect(booking.bookingRequestId).toBe(request.id)
  })

  it('should get all bookings for a student', async () => {
    const request = await createBookingRequest(studentId, teacherId, eventId, 'Request')
    await createBooking(studentId, teacherId, eventId, request.id)
    const bookings = await getStudentBookings(studentId)

    expect(bookings.length).toBeGreaterThan(0)
  })

  it('should get all bookings for a teacher', async () => {
    const request = await createBookingRequest(studentId, teacherId, eventId, 'Request')
    await createBooking(studentId, teacherId, eventId, request.id)
    const bookings = await getTeacherBookings(teacherId)

    expect(bookings.length).toBeGreaterThan(0)
  })

  it('should cancel a booking', async () => {
    const request = await createBookingRequest(studentId, teacherId, eventId, 'Request')
    const booking = await createBooking(studentId, teacherId, eventId, request.id)
    await cancelBooking(booking.id)

    const bookings = await getStudentBookings(studentId)
    expect(bookings).toHaveLength(0)
  })
})
```

執行測試：
```bash
pnpm vitest tests/unit/bookings/bookings.test.ts
```

預期：9 個測試失敗

- [ ] **Step 2: 實現預約查詢函數**

建立 `server/db/queries/bookings.ts`：

```typescript
import { eq, and } from 'drizzle-orm'
import { getDB, schema } from '../index'
import type { BookingRequest, NewBookingRequest, Booking, NewBooking, BookingStatus } from '../schema'

export async function createBookingRequest(
  studentId: number,
  teacherId: number,
  calendarEventId: number,
  message?: string
): Promise<BookingRequest> {
  const db = getDB()
  const [request] = await db
    .insert(schema.bookingRequests)
    .values({
      studentId,
      teacherId,
      calendarEventId,
      message: message || null,
      status: 'pending',
    })
    .returning()
  return request
}

export async function getBookingRequestById(id: number): Promise<BookingRequest | null> {
  const db = getDB()
  const [request] = await db
    .select()
    .from(schema.bookingRequests)
    .where(eq(schema.bookingRequests.id, id))
  return request || null
}

export async function getTeacherBookingRequests(teacherId: number): Promise<BookingRequest[]> {
  const db = getDB()
  return await db
    .select()
    .from(schema.bookingRequests)
    .where(
      and(
        eq(schema.bookingRequests.teacherId, teacherId),
        eq(schema.bookingRequests.status, 'pending')
      )
    )
    .orderBy(schema.bookingRequests.requestedAt)
}

export async function getStudentBookingRequests(studentId: number): Promise<BookingRequest[]> {
  const db = getDB()
  return await db
    .select()
    .from(schema.bookingRequests)
    .where(eq(schema.bookingRequests.studentId, studentId))
    .orderBy(schema.bookingRequests.requestedAt)
}

export async function updateBookingRequestStatus(
  id: number,
  status: BookingStatus
): Promise<BookingRequest> {
  const db = getDB()
  const [request] = await db
    .update(schema.bookingRequests)
    .set({
      status,
      respondedAt: status !== 'pending' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(schema.bookingRequests.id, id))
    .returning()
  return request
}

export async function createBooking(
  studentId: number,
  teacherId: number,
  calendarEventId: number,
  bookingRequestId?: number
): Promise<Booking> {
  const db = getDB()
  const [booking] = await db
    .insert(schema.bookings)
    .values({
      studentId,
      teacherId,
      calendarEventId,
      bookingRequestId: bookingRequestId || null,
      bookingDate: new Date(),
    })
    .returning()
  return booking
}

export async function getStudentBookings(studentId: number): Promise<(Booking & { event: typeof schema.calendarEvents.$inferSelect })[]> {
  const db = getDB()
  return await db
    .select()
    .from(schema.bookings)
    .leftJoin(schema.calendarEvents, eq(schema.bookings.calendarEventId, schema.calendarEvents.id))
    .where(eq(schema.bookings.studentId, studentId))
}

export async function getTeacherBookings(teacherId: number): Promise<(Booking & { event: typeof schema.calendarEvents.$inferSelect })[]> {
  const db = getDB()
  return await db
    .select()
    .from(schema.bookings)
    .leftJoin(schema.calendarEvents, eq(schema.bookings.calendarEventId, schema.calendarEvents.id))
    .where(eq(schema.bookings.teacherId, teacherId))
}

export async function cancelBooking(id: number): Promise<void> {
  const db = getDB()
  await db.delete(schema.bookings).where(eq(schema.bookings.id, id))
}

export async function getBookingByEventId(eventId: number): Promise<Booking | null> {
  const db = getDB()
  const [booking] = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.calendarEventId, eventId))
  return booking || null
}
```

- [ ] **Step 3: 運行測試驗證**

```bash
pnpm vitest tests/unit/bookings/bookings.test.ts
```

預期：9 個測試通過

- [ ] **Step 4: 提交**

```bash
git add server/db/queries/bookings.ts tests/unit/bookings/
git commit -m "feat: implement booking database queries with CRUD operations"
```

