<script setup lang="ts">
import { reactive, shallowRef, watch } from 'vue'
import type { CalendarEvent, CalendarEventInput } from '~/app/composables/useCalendar'

const props = withDefaults(defineProps<{
  event?: CalendarEvent | null
  loading?: boolean
}>(), {
  event: null,
  loading: false,
})

const emit = defineEmits<{
  (event: 'submit', value: CalendarEventInput): void
  (event: 'cancel'): void
}>()

const form = reactive<CalendarEventInput>({
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  isAvailable: true,
  maxStudents: 1,
})
const error = shallowRef('')

function toDateTimeLocalValue(value?: string) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const offset = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function resetForm() {
  form.title = props.event?.title ?? ''
  form.description = props.event?.description ?? ''
  form.startTime = toDateTimeLocalValue(props.event?.startTime)
  form.endTime = toDateTimeLocalValue(props.event?.endTime)
  form.isAvailable = props.event?.isAvailable ?? true
  form.maxStudents = props.event?.maxStudents ?? 1
  error.value = ''
}

watch(() => props.event, resetForm, { immediate: true })

function handleSubmit() {
  error.value = ''

  if (!form.title.trim()) {
    error.value = 'Title is required'
    return
  }

  if (!form.startTime || !form.endTime) {
    error.value = 'Start and end times are required'
    return
  }

  const start = new Date(form.startTime)
  const end = new Date(form.endTime)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    error.value = 'Start and end times are invalid'
    return
  }

  if (start >= end) {
    error.value = 'Start time must be before end time'
    return
  }

  emit('submit', {
    title: form.title.trim(),
    description: form.description?.trim() || null,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    isAvailable: form.isAvailable,
    maxStudents: form.maxStudents ?? 1,
  })
}
</script>

<template>
  <UCard>
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <UFormField label="Event Title" required>
        <UInput
          v-model="form.title"
          placeholder="e.g., Math Class"
          autocomplete="off"
        />
      </UFormField>

      <UFormField label="Description">
        <UTextarea
          v-model="form.description"
          autoresize
          :rows="3"
          placeholder="Event description..."
        />
      </UFormField>

      <div class="grid gap-4 md:grid-cols-2">
        <UFormField label="Start Time" required>
          <UInput v-model="form.startTime" type="datetime-local" />
        </UFormField>

        <UFormField label="End Time" required>
          <UInput v-model="form.endTime" type="datetime-local" />
        </UFormField>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <UFormField label="Max Students">
          <UInputNumber v-model="form.maxStudents" :min="1" />
        </UFormField>

        <UFormField label="Available for Booking">
          <USwitch
            v-model="form.isAvailable"
            label="Mark as available"
          />
        </UFormField>
      </div>

      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        :description="error"
      />

      <div class="flex justify-end gap-2">
        <UButton
          type="button"
          label="Cancel"
          color="neutral"
          variant="outline"
          @click="emit('cancel')"
        />
        <UButton
          type="submit"
          label="Save Event"
          icon="i-lucide-save"
          :loading="loading"
        />
      </div>
    </form>
  </UCard>
</template>
