## Task 4: 建立預約前端組件和頁面

### 檔案：
- Create: `app/composables/useBookings.ts`
- Create: `app/components/bookings/BookingRequestCard.vue`
- Create: `app/components/bookings/BookingForm.vue`
- Create: `app/pages/teacher/requests.vue`
- Create: `app/pages/student/my-bookings.vue`
- Modify: `app/pages/student/teachers/[id].vue`

- [ ] **Step 1: 建立預約組合函數**

建立 `app/composables/useBookings.ts`：

```typescript
import { ref } from 'vue'

export interface BookingRequest {
  id: number
  studentId: number
  teacherId: number
  calendarEventId: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  message?: string
  requestedAt: string
  respondedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Booking {
  id: number
  studentId: number
  teacherId: number
  calendarEventId: number
  bookingDate: string
  createdAt: string
}

export const useBookings = () => {
  const bookingRequests = ref<BookingRequest[]>([])
  const myBookings = ref<Booking[]>([])
  const loading = ref(false)
  const error = ref('')

  const submitBookingRequest = async (teacherId: number, calendarEventId: number, message?: string) => {
    loading.value = true
    error.value = ''

    try {
      const response = await $fetch('/api/bookings/request', {
        method: 'POST',
        body: { teacherId, calendarEventId, message },
      })
      return response.bookingRequest
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to submit booking request'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchBookingRequests = async () => {
    loading.value = true
    error.value = ''

    try {
      const response = await $fetch('/api/bookings/requests', {
        method: 'GET',
      })
      bookingRequests.value = response.requests
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch booking requests'
      throw err
    } finally {
      loading.value = false
    }
  }

  const reviewBookingRequest = async (requestId: number, status: string) => {
    loading.value = true
    error.value = ''

    try {
      const response = await $fetch(`/api/bookings/requests/${requestId}`, {
        method: 'PUT',
        body: { status },
      })
      
      const index = bookingRequests.value.findIndex(r => r.id === requestId)
      if (index !== -1) {
        bookingRequests.value[index] = response.bookingRequest
      }
      
      return response.bookingRequest
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to review booking request'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMyBookings = async () => {
    loading.value = true
    error.value = ''

    try {
      const response = await $fetch('/api/bookings/my-bookings', {
        method: 'GET',
      })
      myBookings.value = response.bookings
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch bookings'
      throw err
    } finally {
      loading.value = false
    }
  }

  const cancelBooking = async (bookingId: number) => {
    loading.value = true
    error.value = ''

    try {
      await $fetch('/api/bookings/cancel', {
        method: 'DELETE',
        body: { bookingId },
      })
      myBookings.value = myBookings.value.filter(b => b.id !== bookingId)
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to cancel booking'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    bookingRequests,
    myBookings,
    loading,
    error,
    submitBookingRequest,
    fetchBookingRequests,
    reviewBookingRequest,
    fetchMyBookings,
    cancelBooking,
  }
}
```

- [ ] **Step 2: 建立預約請求卡片組件**

建立 `app/components/bookings/BookingRequestCard.vue`：

```vue
<template>
  <div class="bg-white rounded-lg shadow p-4 border-l-4" :class="statusBorderClass">
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <h3 class="font-semibold text-lg">{{ studentName }}</h3>
        <p class="text-gray-600 text-sm">{{ eventTitle }}</p>
        
        <p v-if="request.message" class="text-gray-700 mt-2 text-sm">{{ request.message }}</p>

        <div class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <span>📅 {{ formatDate(request.requestedAt) }}</span>
          <span>🕐 Requested {{ formatTime(request.requestedAt) }}</span>
        </div>

        <div class="mt-2">
          <span :class="statusBadgeClass">
            {{ statusLabel }}
          </span>
        </div>
      </div>

      <div v-if="showActions && request.status === 'pending'" class="flex gap-2 ml-4">
        <button
          @click="$emit('approve')"
          :disabled="loading"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          Approve
        </button>
        <button
          @click="$emit('reject')"
          :disabled="loading"
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
        >
          Reject
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BookingRequest } from '~/composables/useBookings'

const props = defineProps<{
  request: BookingRequest
  studentName: string
  eventTitle: string
  showActions?: boolean
  loading?: boolean
}>()

defineEmits(['approve', 'reject'])

const statusLabel = computed(() => {
  const map = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  }
  return map[props.request.status]
})

const statusBorderClass = computed(() => {
  const map = {
    pending: 'border-yellow-400',
    approved: 'border-green-400',
    rejected: 'border-red-400',
    cancelled: 'border-gray-400',
  }
  return map[props.request.status]
})

const statusBadgeClass = computed(() => {
  const map = {
    pending: 'text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded',
    approved: 'text-xs bg-green-100 text-green-700 px-2 py-1 rounded',
    rejected: 'text-xs bg-red-100 text-red-700 px-2 py-1 rounded',
    cancelled: 'text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded',
  }
  return map[props.request.status]
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}
</script>
```

- [ ] **Step 3: 建立預約表單組件**

建立 `app/components/bookings/BookingForm.vue`：

```vue
<template>
  <form @submit.prevent="handleSubmit" class="bg-white rounded-lg shadow p-6 space-y-4">
    <h3 class="text-lg font-semibold">Request to Book This Class</h3>

    <div>
      <label for="message" class="block text-sm font-medium mb-1">Message (Optional)</label>
      <textarea
        v-model="message"
        id="message"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Tell the teacher why you want to book this class..."
        rows="3"
      ></textarea>
    </div>

    <div v-if="error" class="p-3 bg-red-100 text-red-700 rounded-md text-sm">
      {{ error }}
    </div>

    <button
      type="submit"
      :disabled="loading"
      class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
    >
      {{ loading ? 'Submitting...' : 'Submit Booking Request' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  loading?: boolean
}>()

const emit = defineEmits(['submit'])

const message = ref('')
const error = ref('')

const handleSubmit = () => {
  emit('submit', message.value)
  message.value = ''
}
</script>
```

- [ ] **Step 4: 建立教師預約請求管理頁面**

建立 `app/pages/teacher/requests.vue`：

```vue
<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-3xl font-bold mb-8">Booking Requests</h1>

      <div v-if="loading" class="text-center py-8">
        <p>Loading booking requests...</p>
      </div>

      <div v-else>
        <div class="bg-white rounded-lg shadow p-6 mb-4">
          <h2 class="text-lg font-semibold mb-2">Pending Requests</h2>
          <div class="text-gray-600 text-sm">
            {{ pendingCount }} pending request{{ pendingCount !== 1 ? 's' : '' }}
          </div>
        </div>

        <div v-if="bookings.bookingRequests.length === 0" class="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No booking requests at this time
        </div>

        <div v-else class="space-y-4">
          <BookingRequestCard
            v-for="request in bookings.bookingRequests"
            :key="request.id"
            :request="request"
            :student-name="getStudentName(request.studentId)"
            :event-title="getEventTitle(request.calendarEventId)"
            :show-actions="true"
            :loading="bookings.loading"
            @approve="approveRequest(request.id)"
            @reject="rejectRequest(request.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBookings } from '~/composables/useBookings'

definePageMeta({
  middleware: 'auth',
})

const bookings = useBookings()
const loading = computed(() => bookings.loading.value)
const pendingCount = computed(() => 
  bookings.bookingRequests.value.filter(r => r.status === 'pending').length
)

onMounted(async () => {
  await bookings.fetchBookingRequests()
})

const approveRequest = async (requestId: number) => {
  try {
    await bookings.reviewBookingRequest(requestId, 'approved')
  } catch (err) {
    // Error handled by composable
  }
}

const rejectRequest = async (requestId: number) => {
  if (confirm('Are you sure you want to reject this booking request?')) {
    try {
      await bookings.reviewBookingRequest(requestId, 'rejected')
    } catch (err) {
      // Error handled by composable
    }
  }
}

const getStudentName = (studentId: number) => {
  // 在實際應用中，應該從預約請求中获取學生信息
  return `Student #${studentId}`
}

const getEventTitle = (eventId: number) => {
  // 在實際應用中，應該從預約請求中获取事件信息
  return `Event #${eventId}`
}
</script>
```

- [ ] **Step 5: 建立學生預約列表頁面**

建立 `app/pages/student/my-bookings.vue`：

```vue
<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-3xl font-bold mb-8">My Bookings</h1>

      <div v-if="loading" class="text-center py-8">
        <p>Loading your bookings...</p>
      </div>

      <div v-else>
        <div v-if="bookings.myBookings.value.length === 0" class="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          You don't have any bookings yet
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="booking in bookings.myBookings.value"
            :key="booking.id"
            class="bg-white rounded-lg shadow p-4 flex justify-between items-center"
          >
            <div>
              <h3 class="font-semibold text-lg">Booking #{{ booking.id }}</h3>
              <p class="text-gray-600 text-sm">
                📅 {{ formatDate(booking.bookingDate) }}
              </p>
            </div>
            <button
              @click="cancelBooking(booking.id)"
              :disabled="bookings.loading.value"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBookings } from '~/composables/useBookings'

definePageMeta({
  middleware: 'auth',
})

const bookings = useBookings()
const loading = computed(() => bookings.loading.value)

onMounted(async () => {
  await bookings.fetchMyBookings()
})

const cancelBooking = async (bookingId: number) => {
  if (confirm('Are you sure you want to cancel this booking?')) {
    try {
      await bookings.cancelBooking(bookingId)
    } catch (err) {
      // Error handled by composable
    }
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-TW', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
```

- [ ] **Step 6: 修改學生教師詳情頁面支持預約**

修改 `app/pages/student/teachers/[id].vue`，在事件卡片下方添加預約表單：

```vue
<template #actions>
  <BookingForm
    :loading="bookings.loading"
    @submit="submitBooking(slot, $event)"
  />
</template>

<script setup>
const bookings = useBookings()

const submitBooking = async (slot: CalendarEvent, message: string) => {
  try {
    await bookings.submitBookingRequest(teacher.value.id, slot.id, message)
    alert('Booking request submitted successfully!')
  } catch (err) {
    // Error handled by composable
  }
}
</script>
```

- [ ] **Step 7: 提交**

```bash
git add app/composables/useBookings.ts app/components/bookings/ app/pages/teacher/requests.vue app/pages/student/my-bookings.vue
git commit -m "feat: add booking UI components and pages for students and teachers"
```

