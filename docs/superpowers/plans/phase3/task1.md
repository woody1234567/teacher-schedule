## Task 1: 添加 BookingRequests 和 Bookings 資料庫表

### 檔案：
- Modify: `server/db/schema.ts`

- [ ] **Step 1: 添加預約表定義**

修改 `server/db/schema.ts`，在末尾添加：

```typescript
// 預約狀態枚舉
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',    // 等待教師審核
  'approved',   // 教師接受
  'rejected',   // 教師拒絕
  'cancelled',  // 學生或教師取消
])

// 預約請求表
export const bookingRequests = pgTable('booking_requests', {
  id: serial('id').primaryKey(),
  studentId: serial('student_id').references(() => users.id).notNull(),
  teacherId: serial('teacher_id').references(() => users.id).notNull(),
  calendarEventId: serial('calendar_event_id').references(() => calendarEvents.id).notNull(),
  status: bookingStatusEnum('status').default('pending').notNull(),
  message: text('message'), // 學生的請求訊息
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  respondedAt: timestamp('responded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 確認預約表
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  studentId: serial('student_id').references(() => users.id).notNull(),
  teacherId: serial('teacher_id').references(() => users.id).notNull(),
  calendarEventId: serial('calendar_event_id').references(() => calendarEvents.id).notNull(),
  bookingRequestId: serial('booking_request_id').references(() => bookingRequests.id),
  bookingDate: timestamp('booking_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 關係定義
export const bookingRequestsRelations = relations(bookingRequests, ({ one }) => ({
  student: one(users, {
    fields: [bookingRequests.studentId],
    references: [users.id],
  }),
  teacher: one(users, {
    fields: [bookingRequests.teacherId],
    references: [users.id],
  }),
  calendarEvent: one(calendarEvents, {
    fields: [bookingRequests.calendarEventId],
    references: [calendarEvents.id],
  }),
}))

export const bookingsRelations = relations(bookings, ({ one }) => ({
  student: one(users, {
    fields: [bookings.studentId],
    references: [users.id],
  }),
  teacher: one(users, {
    fields: [bookings.teacherId],
    references: [users.id],
  }),
  calendarEvent: one(calendarEvents, {
    fields: [bookings.calendarEventId],
    references: [calendarEvents.id],
  }),
  bookingRequest: one(bookingRequests, {
    fields: [bookings.bookingRequestId],
    references: [bookingRequests.id],
  }),
}))

export const usersBookingsRelations = relations(users, ({ many }) => ({
  sentBookingRequests: many(bookingRequests), // 學生發送的請求
  receivedBookingRequests: many(bookingRequests), // 教師收到的請求
  studentBookings: many(bookings), // 學生的預約
  teacherBookings: many(bookings), // 教師的預約
}))

// 類型導出
export type BookingRequest = typeof bookingRequests.$inferSelect
export type NewBookingRequest = typeof bookingRequests.$inferInsert
export type Booking = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert
export type BookingStatus = typeof bookingStatusEnum.enumValues[number]
```

- [ ] **Step 2: 生成資料庫遷移**

```bash
pnpm db:migrate
```

驗證 PostgreSQL 中已創建 `booking_requests` 和 `bookings` 表。

- [ ] **Step 3: 提交**

```bash
git add server/db/schema.ts
git commit -m "feat: add BookingRequests and Bookings table schemas"
```

