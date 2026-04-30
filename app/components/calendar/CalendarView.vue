<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import EventCard from './EventCard.vue'
import type { CalendarEvent } from '~/app/composables/useCalendar'

interface CalendarDay {
  date: Date
  dateKey: string
  isCurrentMonth: boolean
  isSelected: boolean
  isToday: boolean
  events: CalendarEvent[]
}

const props = withDefaults(defineProps<{
  events: CalendarEvent[]
  showActions?: boolean
}>(), {
  showActions: false,
})

const emit = defineEmits<{
  (event: 'edit', value: CalendarEvent): void
  (event: 'delete', id: number): void
  (event: 'book', value: CalendarEvent): void
  (event: 'dateSelect', value: Date): void
}>()

const currentDate = shallowRef(new Date())
const selectedDate = shallowRef<Date | null>(null)

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const monthYearLabel = computed(() => {
  return new Intl.DateTimeFormat('zh-TW', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate.value)
})

const selectedDateLabel = computed(() => {
  return selectedDate.value
    ? new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium' }).format(selectedDate.value)
    : ''
})

const selectedDateEvents = computed(() => {
  if (!selectedDate.value) return []

  const selectedKey = toDateKey(selectedDate.value)
  return props.events
    .filter(event => event.startTime.startsWith(selectedKey))
    .toSorted((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

const calendarDays = computed<CalendarDay[]>(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: CalendarDay[] = []

  for (let index = firstDay.getDay() - 1; index >= 0; index--) {
    days.push(buildCalendarDay(new Date(year, month, -index), false))
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(buildCalendarDay(new Date(year, month, day), true))
  }

  const remainingDays = 42 - days.length
  for (let day = 1; day <= remainingDays; day++) {
    days.push(buildCalendarDay(new Date(year, month + 1, day), false))
  }

  return days
})

function toDateKey(date: Date) {
  return date.toISOString().split('T')[0]
}

function buildCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
  const dateKey = toDateKey(date)
  const selectedKey = selectedDate.value ? toDateKey(selectedDate.value) : ''
  const todayKey = toDateKey(new Date())

  return {
    date,
    dateKey,
    isCurrentMonth,
    isSelected: dateKey === selectedKey,
    isToday: dateKey === todayKey,
    events: props.events
      .filter(event => event.startTime.startsWith(dateKey))
      .toSorted((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
  }
}

function getDayClass(day: CalendarDay) {
  return [
    day.isCurrentMonth ? 'bg-default text-default' : 'bg-muted/40 text-muted',
    day.isSelected ? 'ring-2 ring-primary bg-primary/10' : 'ring ring-muted',
    day.isToday && !day.isSelected ? 'ring-primary/50' : '',
  ]
}

function previousMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

function today() {
  currentDate.value = new Date()
  selectDate(new Date())
}

function selectDate(date: Date) {
  selectedDate.value = new Date(date)
  emit('dateSelect', selectedDate.value)
}
</script>

<template>
  <UCard>
    <div class="space-y-6">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 class="text-xl font-semibold text-highlighted">
          {{ monthYearLabel }}
        </h2>

        <div class="flex flex-wrap gap-2">
          <UButton
            icon="i-lucide-chevron-left"
            label="Previous"
            color="neutral"
            variant="outline"
            @click="previousMonth"
          />
          <UButton
            label="Today"
            color="primary"
            variant="soft"
            @click="today"
          />
          <UButton
            trailing-icon="i-lucide-chevron-right"
            label="Next"
            color="neutral"
            variant="outline"
            @click="nextMonth"
          />
        </div>
      </div>

      <div class="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted">
        <div v-for="day in weekDays" :key="day" class="py-2">
          {{ day }}
        </div>
      </div>

      <div class="grid grid-cols-7 gap-2">
        <button
          v-for="day in calendarDays"
          :key="day.dateKey"
          type="button"
          :class="getDayClass(day)"
          class="min-h-28 rounded-md p-2 text-left transition hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          @click="selectDate(day.date)"
        >
          <span class="text-sm font-semibold">
            {{ day.date.getDate() }}
          </span>

          <span v-if="day.events.length > 0" class="mt-2 block space-y-1">
            <span
              v-for="event in day.events.slice(0, 2)"
              :key="event.id"
              class="block truncate rounded bg-primary/10 px-1.5 py-1 text-xs text-primary"
            >
              {{ event.title }}
            </span>
            <span v-if="day.events.length > 2" class="block text-xs text-muted">
              +{{ day.events.length - 2 }} more
            </span>
          </span>
        </button>
      </div>

      <div v-if="selectedDate" class="space-y-4">
        <h3 class="text-base font-semibold text-highlighted">
          Events on {{ selectedDateLabel }}
        </h3>

        <UAlert
          v-if="selectedDateEvents.length === 0"
          color="neutral"
          variant="soft"
          icon="i-lucide-calendar"
          description="No events on this day"
        />

        <div v-else class="space-y-3">
          <EventCard
            v-for="event in selectedDateEvents"
            :key="event.id"
            :event="event"
            :show-actions="showActions"
            @edit="emit('edit', event)"
            @delete="emit('delete', event.id)"
            @book="emit('book', event)"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>
