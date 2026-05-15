import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAdminRoleReviews } from '~/app/composables/useAdminRoleReviews'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

function makeReview(id: number, requestedRole: 'teacher' | 'student' = 'teacher') {
  return {
    id,
    userId: `u${id}`,
    requestedRole,
    status: 'pending',
    reviewedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: { id: `u${id}`, email: `u${id}@example.com`, name: `User ${id}` },
  }
}

describe('useAdminRoleReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads pending reviews from API', async () => {
    const reviews = [makeReview(1), makeReview(2, 'student')]
    mockFetch.mockResolvedValueOnce(reviews)

    const { reviews: reviewsRef, loadReviews } = useAdminRoleReviews()
    await loadReviews()

    expect(mockFetch).toHaveBeenCalledWith('/api/admin/role-reviews')
    expect(reviewsRef.value).toEqual(reviews)
  })

  it('sets error message when load fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Forbidden'))

    const { error, loadReviews } = useAdminRoleReviews()
    await loadReviews()

    expect(error.value).toBe('Forbidden')
  })

  it('removes review from list after approve', async () => {
    const reviews = [makeReview(1), makeReview(2)]
    mockFetch.mockResolvedValueOnce(reviews)
    mockFetch.mockResolvedValueOnce({ review: { id: 1, status: 'approved' }, user: {} })

    const { reviews: reviewsRef, loadReviews, approve } = useAdminRoleReviews()
    await loadReviews()
    await approve(1)

    expect(mockFetch).toHaveBeenLastCalledWith('/api/admin/role-reviews/1/approve', { method: 'POST' })
    expect(reviewsRef.value).toHaveLength(1)
    expect(reviewsRef.value[0]?.id).toBe(2)
  })

  it('sets error and rethrows when approve fails', async () => {
    mockFetch.mockResolvedValueOnce([makeReview(1)])
    mockFetch.mockRejectedValueOnce(new Error('Forbidden'))

    const { loadReviews, approve, error } = useAdminRoleReviews()
    await loadReviews()

    await expect(approve(1)).rejects.toThrow('Forbidden')
    expect(error.value).toBe('Forbidden')
  })

  it('removes review from list after reject', async () => {
    const reviews = [makeReview(1), makeReview(2)]
    mockFetch.mockResolvedValueOnce(reviews)
    mockFetch.mockResolvedValueOnce({ id: 1, status: 'rejected' })

    const { reviews: reviewsRef, loadReviews, reject } = useAdminRoleReviews()
    await loadReviews()
    await reject(1)

    expect(mockFetch).toHaveBeenLastCalledWith('/api/admin/role-reviews/1/reject', { method: 'POST' })
    expect(reviewsRef.value).toHaveLength(1)
    expect(reviewsRef.value[0]?.id).toBe(2)
  })

  it('tracks processing state during approve', async () => {
    let resolve: ((v: unknown) => void) | undefined
    mockFetch
      .mockResolvedValueOnce([makeReview(1)])
      .mockReturnValueOnce(new Promise(r => { resolve = r }))

    const { loadReviews, approve, isProcessing } = useAdminRoleReviews()
    await loadReviews()

    const approvePromise = approve(1)
    expect(isProcessing(1)).toBe(true)
    resolve?.({})
    await approvePromise
    expect(isProcessing(1)).toBe(false)
  })

  it('isProcessing is false for uninvolved IDs', async () => {
    mockFetch.mockResolvedValueOnce([makeReview(1), makeReview(2)])
    let resolve: ((v: unknown) => void) | undefined
    mockFetch.mockReturnValueOnce(new Promise(r => { resolve = r }))

    const { loadReviews, approve, isProcessing } = useAdminRoleReviews()
    await loadReviews()

    approve(1)
    expect(isProcessing(1)).toBe(true)
    expect(isProcessing(2)).toBe(false)
    resolve?.({})
  })
})
