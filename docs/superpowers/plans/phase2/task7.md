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

