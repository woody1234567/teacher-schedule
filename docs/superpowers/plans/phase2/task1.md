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

