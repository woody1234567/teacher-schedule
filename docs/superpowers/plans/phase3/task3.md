## Task 3: 建立預約 API 端點

### 檔案：
- Create: `server/api/bookings/request.post.ts`
- Create: `server/api/bookings/requests.get.ts`
- Create: `server/api/bookings/requests/[id].put.ts`
- Create: `server/api/bookings/my-bookings.get.ts`
- Create: `server/api/bookings/cancel.delete.ts`
- Create: `tests/integration/bookings.test.ts`

- [ ] **Step 1: 寫預約 API 集成測試**

建立 `tests/integration/bookings.test.ts`：

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { getDB, schema } from '~/server/db'
import { hashPassword } from '~/server/utils/auth'
import { createUser } from '~/server/db/queries/users'
import { createCalendarEvent } from '~/server/db/queries/calendar'

describe('Bookings API', () => {
  let studentId: number
  let teacherId: number
  let eventId: number
  let studentAuthToken: string
  let teacherAuthToken: string

  beforeEach(async () => {
    const db = getDB()
    const studentEmail = 'student-book@example.com'
    const teacherEmail = 'teacher-book@example.com'
    
    await db.delete(schema.users).where(eq(schema.users.email, studentEmail))
    await db.delete(schema.users).where(eq(schema.users.email, teacherEmail))

    // 創建測試用戶
    const passwordHash = await hashPassword('TestPassword123!')
    const student = await createUser({
      email: studentEmail,
      name: 'Student Book',
      passwordHash,
      role: 'student',
    })
    const teacher = await createUser({
      email: teacherEmail,
      name: 'Teacher Book',
      passwordHash,
      role: 'teacher',
    })
    studentId = student.id
    teacherId = teacher.id

    // 登錄獲取 token
    const studentLogin = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: studentEmail, password: 'TestPassword123!' },
    })
    const teacherLogin = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: teacherEmail, password: 'TestPassword123!' },
    })
    studentAuthToken = studentLogin.token
    teacherAuthToken = teacherLogin.token

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
    await db.delete(schema.users).where(eq(schema.users.email, 'student-book@example.com'))
    await db.delete(schema.users).where(eq(schema.users.email, 'teacher-book@example.com'))
  })

  it('should student create a booking request', async () => {
    const response = await $fetch('/api/bookings/request', {
      method: 'POST',
      body: {
        teacherId,
        calendarEventId: eventId,
        message: 'I would like to book this class',
      },
      headers: { 'Cookie': `auth_token=${studentAuthToken}` },
    })

    expect(response.bookingRequest).toBeDefined()
    expect(response.bookingRequest.status).toBe('pending')
    expect(response.bookingRequest.studentId).toBe(studentId)
  })

  it('should teacher get booking requests', async () => {
    await $fetch('/api/bookings/request', {
      method: 'POST',
      body: {
        teacherId,
        calendarEventId: eventId,
        message: 'Request',
      },
      headers: { 'Cookie': `auth_token=${studentAuthToken}` },
    })

    const response = await $fetch('/api/bookings/requests', {
      method: 'GET',
      headers: { 'Cookie': `auth_token=${teacherAuthToken}` },
    })

    expect(Array.isArray(response.requests)).toBe(true)
    expect(response.requests.length).toBeGreaterThan(0)
  })

  it('should teacher approve booking request', async () => {
    const request = await $fetch('/api/bookings/request', {
      method: 'POST',
      body: {
        teacherId,
        calendarEventId: eventId,
        message: 'Request',
      },
      headers: { 'Cookie': `auth_token=${studentAuthToken}` },
    })

    const response = await $fetch(`/api/bookings/requests/${request.bookingRequest.id}`, {
      method: 'PUT',
      body: { status: 'approved' },
      headers: { 'Cookie': `auth_token=${teacherAuthToken}` },
    })

    expect(response.bookingRequest.status).toBe('approved')
  })

  it('should student get their bookings', async () => {
    const bookingRequest = await $fetch('/api/bookings/request', {
      method: 'POST',
      body: {
        teacherId,
        calendarEventId: eventId,
        message: 'Request',
      },
      headers: { 'Cookie': `auth_token=${studentAuthToken}` },
    })

    await $fetch(`/api/bookings/requests/${bookingRequest.bookingRequest.id}`, {
      method: 'PUT',
      body: { status: 'approved' },
      headers: { 'Cookie': `auth_token=${teacherAuthToken}` },
    })

    const response = await $fetch('/api/bookings/my-bookings', {
      method: 'GET',
      headers: { 'Cookie': `auth_token=${studentAuthToken}` },
    })

    expect(Array.isArray(response.bookings)).toBe(true)
  })

  it('should reject unauthenticated booking request', async () => {
    const error = await $fetch('/api/bookings/request', {
      method: 'POST',
      body: {
        teacherId,
        calendarEventId: eventId,
        message: 'Request',
      },
    }).catch(e => e.data)

    expect(error).toBeDefined()
    expect(error.statusCode).toBe(401)
  })
})
```

執行測試：
```bash
pnpm vitest tests/integration/bookings.test.ts
```

預期：5 個測試失敗

- [ ] **Step 2: 實現 POST /api/bookings/request 端點**

建立 `server/api/bookings/request.post.ts`：

```typescript
import { authenticateRequest } from '~/server/utils/auth'
import { getCalendarEventById } from '~/server/db/queries/calendar'
import { createBookingRequest } from '~/server/db/queries/bookings'

export default defineEventHandler(async (event) => {
  const user = await authenticateRequest(event)
  const body = await readBody(event)

  // 只有學生可以創建預約請求
  if (user.role !== 'student') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only students can create booking requests',
    })
  }

  const { teacherId, calendarEventId, message } = body

  if (!teacherId || !calendarEventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
    })
  }

  // 驗證行事曆事件存在並屬於該教師
  const event = await getCalendarEventById(calendarEventId)

  if (!event) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Calendar event not found',
    })
  }

  if (event.teacherId !== teacherId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'This event does not belong to the specified teacher',
    })
  }

  // 創建預約請求
  const bookingRequest = await createBookingRequest(
    user.id,
    teacherId,
    calendarEventId,
    message || null
  )

  return {
    bookingRequest,
  }
})
```

- [ ] **Step 3: 實現 GET /api/bookings/requests 端點**

建立 `server/api/bookings/requests.get.ts`：

```typescript
import { authenticateRequest } from '~/server/utils/auth'
import { getTeacherBookingRequests } from '~/server/db/queries/bookings'

export default defineEventHandler(async (event) => {
  const user = await authenticateRequest(event)

  // 只有教師可以查看預約請求
  if (user.role !== 'teacher') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only teachers can view booking requests',
    })
  }

  const requests = await getTeacherBookingRequests(user.id)

  return {
    requests,
  }
})
```

- [ ] **Step 4: 實現 PUT /api/bookings/requests/[id] 端點**

建立 `server/api/bookings/requests/[id].put.ts`：

```typescript
import { authenticateRequest } from '~/server/utils/auth'
import { getBookingRequestById, updateBookingRequestStatus, createBooking } from '~/server/db/queries/bookings'

export default defineEventHandler(async (event) => {
  const user = await authenticateRequest(event)
  const { id } = event.context.params
  const body = await readBody(event)

  // 只有教師可以審核預約請求
  if (user.role !== 'teacher') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only teachers can review booking requests',
    })
  }

  const { status } = body

  if (!['approved', 'rejected', 'cancelled'].includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid status',
    })
  }

  // 驗證預約請求存在且屬於該教師
  const bookingRequest = await getBookingRequestById(Number(id))

  if (!bookingRequest) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Booking request not found',
    })
  }

  if (bookingRequest.teacherId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You can only review your own booking requests',
    })
  }

  // 更新狀態
  const updated = await updateBookingRequestStatus(Number(id), status)

  // 如果批准，創建預約
  if (status === 'approved') {
    await createBooking(
      bookingRequest.studentId,
      bookingRequest.teacherId,
      bookingRequest.calendarEventId,
      Number(id)
    )
  }

  return {
    bookingRequest: updated,
  }
})
```

- [ ] **Step 5: 實現 GET /api/bookings/my-bookings 端點**

建立 `server/api/bookings/my-bookings.get.ts`：

```typescript
import { authenticateRequest } from '~/server/utils/auth'
import { getStudentBookings, getTeacherBookings } from '~/server/db/queries/bookings'

export default defineEventHandler(async (event) => {
  const user = await authenticateRequest(event)

  let bookings

  if (user.role === 'student') {
    bookings = await getStudentBookings(user.id)
  } else if (user.role === 'teacher') {
    bookings = await getTeacherBookings(user.id)
  } else {
    throw createError({
      statusCode: 403,
      statusMessage: 'Invalid user role',
    })
  }

  return {
    bookings,
  }
})
```

- [ ] **Step 6: 實現 DELETE /api/bookings/cancel 端點**

建立 `server/api/bookings/cancel.delete.ts`：

```typescript
import { authenticateRequest } from '~/server/utils/auth'
import { getDB, schema } from '~/server/db'
import { eq } from 'drizzle-orm'
import { cancelBooking } from '~/server/db/queries/bookings'

export default defineEventHandler(async (event) => {
  const user = await authenticateRequest(event)
  const { bookingId } = await readBody(event)

  if (!bookingId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Booking ID is required',
    })
  }

  // 驗證預約存在且屬於該用戶
  const db = getDB()
  const [booking] = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.id, bookingId))

  if (!booking) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Booking not found',
    })
  }

  if (booking.studentId !== user.id && booking.teacherId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You can only cancel your own bookings',
    })
  }

  await cancelBooking(Number(bookingId))

  return {
    success: true,
    message: 'Booking cancelled successfully',
  }
})
```

- [ ] **Step 7: 運行測試驗證**

```bash
pnpm vitest tests/integration/bookings.test.ts
```

預期：5 個測試通過

- [ ] **Step 8: 提交**

```bash
git add server/api/bookings/ tests/integration/bookings.test.ts
git commit -m "feat: implement booking request and approval API endpoints"
```

