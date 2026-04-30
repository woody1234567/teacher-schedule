<script setup lang="ts">
import { computed, onMounted } from 'vue'

definePageMeta({
  role: 'admin',
})

const {
  users,
  loading,
  error,
  loadUsers,
  isUpdatingUser,
  updateRole,
} = useAdminUsers()

const roleOptions = [
  { label: 'Student', value: 'student' },
  { label: 'Teacher', value: 'teacher' },
  { label: 'Admin', value: 'admin' },
]

const sortedUsers = computed(() =>
  [...users.value].sort((a, b) => a.email.localeCompare(b.email)),
)

function normalizeRole(value: unknown): 'student' | 'teacher' | 'admin' | undefined {
  if (value === 'student' || value === 'teacher' || value === 'admin') {
    return value
  }

  if (
    typeof value === 'object'
    && value !== null
    && 'value' in value
  ) {
    return normalizeRole(value.value)
  }
}

async function handleRoleChange(userId: string, value: unknown) {
  const role = normalizeRole(value)
  if (!role) {
    return
  }

  try {
    await updateRole(userId, role)
  } catch {
    // The composable restores the previous role and exposes the error message.
  }
}

onMounted(() => {
  void loadUsers()
})
</script>

<template>
  <UContainer class="py-8">
    <UPageHeader
      title="Admin"
      description="Manage user roles."
    />

    <UAlert
      v-if="error"
      color="error"
      :description="error"
      class="mb-4"
    />

    <div class="rounded-lg border border-default overflow-hidden">
      <div class="grid grid-cols-[1fr_140px_180px] gap-4 bg-muted px-4 py-3 text-sm font-medium text-muted">
        <span>User</span>
        <span>Status</span>
        <span>Role</span>
      </div>

      <div
        v-if="loading && sortedUsers.length === 0"
        class="px-4 py-6 text-sm text-muted"
      >
        Loading users...
      </div>

      <div
        v-for="user in sortedUsers"
        :key="user.id"
        class="grid grid-cols-[1fr_140px_180px] gap-4 border-t border-default px-4 py-3 items-center"
      >
        <div class="min-w-0">
          <p class="truncate font-medium">
            {{ user.name || 'Unnamed user' }}
          </p>
          <p class="truncate text-sm text-muted">
            {{ user.email }}
          </p>
        </div>

        <UBadge
          :color="user.emailVerified ? 'success' : 'neutral'"
          variant="subtle"
          class="w-fit"
        >
          {{ user.emailVerified ? 'Verified' : 'Unverified' }}
        </UBadge>

        <USelect
          :model-value="user.role"
          :items="roleOptions"
          value-key="value"
          :disabled="isUpdatingUser(user.id)"
          @update:model-value="handleRoleChange(user.id, $event)"
        />
      </div>
    </div>
  </UContainer>
</template>
