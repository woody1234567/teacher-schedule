import { shallowRef } from 'vue'

export interface RoleReviewWithUser {
  id: number
  userId: string
  requestedRole: string
  status: string
  reviewedBy: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; email: string; name: string | null }
}

export function useAdminRoleReviews() {
  const reviews = shallowRef<RoleReviewWithUser[]>([])
  const loading = shallowRef(false)
  const processingIds = shallowRef<Set<number>>(new Set())
  const error = shallowRef('')

  function getErrorMessage(err: unknown, fallback: string) {
    return err instanceof Error ? err.message : fallback
  }

  function setProcessing(id: number, processing: boolean) {
    const next = new Set(processingIds.value)
    if (processing) next.add(id); else next.delete(id)
    processingIds.value = next
  }

  function isProcessing(id: number) {
    return processingIds.value.has(id)
  }

  async function loadReviews() {
    error.value = ''
    loading.value = true
    try {
      reviews.value = await $fetch<RoleReviewWithUser[]>('/api/admin/role-reviews')
    } catch (err) {
      error.value = getErrorMessage(err, 'Failed to load role requests')
    } finally {
      loading.value = false
    }
  }

  async function approve(id: number) {
    error.value = ''
    setProcessing(id, true)
    try {
      await $fetch(`/api/admin/role-reviews/${id}/approve`, { method: 'POST' })
      reviews.value = reviews.value.filter(r => r.id !== id)
    } catch (err) {
      error.value = getErrorMessage(err, 'Failed to approve request')
      throw err
    } finally {
      setProcessing(id, false)
    }
  }

  async function reject(id: number) {
    error.value = ''
    setProcessing(id, true)
    try {
      await $fetch(`/api/admin/role-reviews/${id}/reject`, { method: 'POST' })
      reviews.value = reviews.value.filter(r => r.id !== id)
    } catch (err) {
      error.value = getErrorMessage(err, 'Failed to reject request')
      throw err
    } finally {
      setProcessing(id, false)
    }
  }

  return { reviews, loading, processingIds, error, loadReviews, isProcessing, approve, reject }
}
