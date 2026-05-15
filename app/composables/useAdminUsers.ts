import { shallowRef } from 'vue'

export type AdminUserRole = 'student' | 'teacher' | 'admin' | 'visitor'

export interface AdminUser {
  id: string
  email: string
  name: string | null
  emailVerified: boolean | null
  image: string | null
  role: AdminUserRole
  createdAt?: string | Date
  updatedAt?: string | Date
}

export function useAdminUsers() {
  const users = shallowRef<AdminUser[]>([])
  const loading = shallowRef(false)
  const updatingUserIds = shallowRef<Set<string>>(new Set())
  const error = shallowRef('')

  function getErrorMessage(err: unknown, fallback: string) {
    return err instanceof Error ? err.message : fallback
  }

  function setUserUpdating(userId: string, updating: boolean) {
    const next = new Set(updatingUserIds.value)

    if (updating) {
      next.add(userId)
    } else {
      next.delete(userId)
    }

    updatingUserIds.value = next
  }

  function isUpdatingUser(userId: string) {
    return updatingUserIds.value.has(userId)
  }

  async function loadUsers() {
    error.value = ''
    loading.value = true

    try {
      users.value = await $fetch<AdminUser[]>('/api/admin/users')
    } catch (err) {
      error.value = getErrorMessage(err, 'Failed to load users')
    } finally {
      loading.value = false
    }
  }

  async function updateRole(userId: string, role: AdminUserRole) {
    error.value = ''
    setUserUpdating(userId, true)

    // Removed optimistic update. Will only update UI after successful API call.

    try {
      const updated = await $fetch<AdminUser>(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: { role },
      })

      users.value = users.value.map(user => user.id === userId ? updated : user)
      return updated
    } catch (err) {
      error.value = getErrorMessage(err, 'Failed to update role')
      throw err
    } finally {
      setUserUpdating(userId, false)
    }
  }

  return {
    users,
    loading,
    updatingUserIds,
    error,
    loadUsers,
    isUpdatingUser,
    updateRole,
  }
}
