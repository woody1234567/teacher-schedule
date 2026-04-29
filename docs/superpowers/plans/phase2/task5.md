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

