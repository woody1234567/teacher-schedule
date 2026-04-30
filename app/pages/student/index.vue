<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'

interface TeacherSummary {
  id: string
  email: string
  name: string | null
  image: string | null
  role: 'teacher'
}

definePageMeta({
  title: 'Student Dashboard',
  role: 'student',
})

const teachers = shallowRef<TeacherSummary[]>([])
const loading = shallowRef(false)
const error = shallowRef('')

const sortedTeachers = computed(() =>
  [...teachers.value].sort((a, b) =>
    (a.name || a.email).localeCompare(b.name || b.email),
  ),
)

onMounted(async () => {
  loading.value = true
  error.value = ''

  try {
    teachers.value = await $fetch<TeacherSummary[]>('/api/teachers')
  }
  catch (err) {
    if (typeof err === 'object' && err !== null && 'data' in err) {
      const data = (err as { data?: { message?: string, statusMessage?: string } }).data
      error.value = data?.message || data?.statusMessage || 'Failed to load teachers'
    }
    else {
      error.value = 'Failed to load teachers'
    }
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <UContainer class="py-10">
    <UPageHeader
      title="Student Dashboard"
      description="Find a teacher and review available time slots before requesting a booking."
    />

    <UAlert
      v-if="error"
      class="mt-6"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :description="error"
    />

    <section class="mt-8 space-y-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-semibold text-highlighted">
            Teachers
          </h2>
          <p class="text-sm text-muted">
            Select a teacher to view published availability.
          </p>
        </div>

        <UBadge color="neutral" variant="soft">
          {{ sortedTeachers.length }} teachers
        </UBadge>
      </div>

      <UCard v-if="loading && sortedTeachers.length === 0">
        <div class="flex items-center justify-center gap-3 py-8 text-muted">
          <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
          <span>Loading teachers...</span>
        </div>
      </UCard>

      <UAlert
        v-else-if="sortedTeachers.length === 0"
        color="neutral"
        variant="soft"
        icon="i-lucide-users"
        description="No teachers are available yet."
      />

      <div v-else class="grid gap-4 md:grid-cols-2">
        <UCard
          v-for="teacher in sortedTeachers"
          :key="teacher.id"
        >
          <div class="flex h-full flex-col gap-5">
            <div class="flex items-start gap-3">
              <UAvatar
                :src="teacher.image || undefined"
                :alt="teacher.name || teacher.email"
                :text="(teacher.name || teacher.email).slice(0, 1).toUpperCase()"
                size="lg"
              />

              <div class="min-w-0 space-y-1">
                <h3 class="truncate text-base font-semibold text-highlighted">
                  {{ teacher.name || 'Teacher' }}
                </h3>
                <p class="truncate text-sm text-muted">
                  {{ teacher.email }}
                </p>
              </div>
            </div>

            <UButton
              :to="`/student/teachers/${teacher.id}`"
              label="View Availability"
              trailing-icon="i-lucide-arrow-right"
              class="mt-auto w-fit"
            />
          </div>
        </UCard>
      </div>
    </section>
  </UContainer>
</template>
