# Role Request & Admin Review System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the instant visitor role-pick (direct DB update) with a request-and-review workflow where visitors submit a role request and an admin approves or rejects it.

**Architecture:** A new `role_reviews` table records each visitor's requested role and approval status. The visitor `POST /api/visitor/role` endpoint now creates a review record instead of updating the user directly. A new set of admin API endpoints and a new admin page let the admin list, approve, and reject pending requests; approval updates the user's role via the existing `updateUserRole` query.

**Tech Stack:** Nuxt 4, Vue 3 Composition API, @nuxt/ui, Drizzle ORM + PostgreSQL, Vitest, H3/Nitro, Better Auth

---

## File Map

| Action | File |
|--------|------|
| Modify | `server/db/schema.ts` — add `roleReviews` table |
| New | `server/db/migrations/0005_*.sql` — auto-generated |
| New | `server/db/queries/role-reviews.ts` — CRUD for role_reviews |
| Modify | `server/services/visitor.ts` — replace `pickRoleForVisitor` with `requestRoleForVisitor` |
| New | `server/services/admin-role-reviews.ts` — list/approve/reject for admin |
| Modify | `server/api/visitor/role.post.ts` — call `requestRoleForVisitor` |
| New | `server/api/visitor/role-request.get.ts` — return pending request for current visitor |
| New | `server/api/admin/role-reviews/index.get.ts` — list pending requests |
| New | `server/api/admin/role-reviews/[id]/approve.post.ts` |
| New | `server/api/admin/role-reviews/[id]/reject.post.ts` |
| New | `app/composables/useAdminRoleReviews.ts` |
| New | `app/pages/admin/role-reviews.vue` |
| Modify | `app/pages/visitor/role_pick.vue` — show pending state, add check-approval |
| Modify | `tests/unit/server/services/visitor.test.ts` — rewrite for new function |
| New | `tests/unit/server/services/admin-role-reviews.test.ts` |
| New | `tests/unit/composables/useAdminRoleReviews.test.ts` |

---

### Task 1: Add role_reviews table to schema and generate migration

**Files:**
- Modify: `server/db/schema.ts`
- Run: `pnpm drizzle-kit generate` then `pnpm drizzle-kit migrate`

- [ ] **Step 1: Add roleReviews table to schema**

Open `server/db/schema.ts`. After the `calendarEvents` table, add:

```ts
export const roleReviews = pgTable('role_reviews', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  requestedRole: text('requested_role').notNull(),
  status: text('status').notNull().default('pending'),
  reviewedBy: text('reviewed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type RoleReview = typeof roleReviews.$inferSelect
export type NewRoleReview = typeof roleReviews.$inferInsert
```

- [ ] **Step 2: Generate migration**

```bash
pnpm drizzle-kit generate
```

Expected: a new file `server/db/migrations/0005_*.sql` appears with `CREATE TABLE role_reviews`.

- [ ] **Step 3: Apply migration**

```bash
pnpm drizzle-kit migrate
```

Expected: `Applying migration 0005_*.sql` printed, no errors.

- [ ] **Step 4: Commit**

```bash
git add server/db/schema.ts server/db/migrations/
git commit -m "feat: add role_reviews table schema and migration"
```

---

### Task 2: DB queries for role_reviews

**Files:**
- Create: `server/db/queries/role-reviews.ts`

Note: these are thin DB wrappers; tests are at the service layer (Tasks 3 & 4) which mock these functions.

- [ ] **Step 1: Create the queries file**

Create `server/db/queries/role-reviews.ts`:

```ts
import { and, desc, eq } from 'drizzle-orm'
import { getDatabase } from '../index'
import { roleReviews, users } from '../schema'

export type RoleRequestStatus = 'pending' | 'approved' | 'rejected'
export type PickableRole = 'teacher' | 'student'
export type RoleReview = typeof roleReviews.$inferSelect
export type RoleReviewWithUser = RoleReview & {
  user: { id: string; email: string; name: string | null }
}

export async function createRoleRequest(
  userId: string,
  requestedRole: PickableRole,
): Promise<RoleReview> {
  const db = getDatabase()
  const [review] = await db
    .insert(roleReviews)
    .values({ userId, requestedRole, status: 'pending', updatedAt: new Date() })
    .returning()
  return review
}

export async function getPendingRequestByUserId(userId: string): Promise<RoleReview | undefined> {
  const db = getDatabase()
  const result = await db
    .select()
    .from(roleReviews)
    .where(and(eq(roleReviews.userId, userId), eq(roleReviews.status, 'pending')))
    .limit(1)
  return result[0]
}

export async function getRoleRequestById(id: number): Promise<RoleReview | undefined> {
  const db = getDatabase()
  const result = await db
    .select()
    .from(roleReviews)
    .where(eq(roleReviews.id, id))
    .limit(1)
  return result[0]
}

export async function listPendingRoleRequests(): Promise<RoleReviewWithUser[]> {
  const db = getDatabase()
  return await db
    .select({
      id: roleReviews.id,
      userId: roleReviews.userId,
      requestedRole: roleReviews.requestedRole,
      status: roleReviews.status,
      reviewedBy: roleReviews.reviewedBy,
      createdAt: roleReviews.createdAt,
      updatedAt: roleReviews.updatedAt,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
      },
    })
    .from(roleReviews)
    .innerJoin(users, eq(roleReviews.userId, users.id))
    .where(eq(roleReviews.status, 'pending'))
    .orderBy(desc(roleReviews.createdAt))
}

export async function updateRoleRequestStatus(
  id: number,
  status: RoleRequestStatus,
  reviewedBy: string,
): Promise<RoleReview | undefined> {
  const db = getDatabase()
  const result = await db
    .update(roleReviews)
    .set({ status, reviewedBy, updatedAt: new Date() })
    .where(eq(roleReviews.id, id))
    .returning()
  return result[0]
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm nuxt typecheck 2>&1 | head -30
```

Expected: no errors from `role-reviews.ts`.

- [ ] **Step 3: Commit**

```bash
git add server/db/queries/role-reviews.ts
git commit -m "feat: add role_reviews DB queries"
```

---

### Task 3: Replace pickRoleForVisitor with requestRoleForVisitor

**Files:**
- Modify: `server/services/visitor.ts`
- Modify: `tests/unit/server/services/visitor.test.ts`

- [ ] **Step 1: Write the failing tests**

Replace the entire contents of `tests/unit/server/services/visitor.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db/queries/role-reviews', () => ({
  createRoleRequest: vi.fn(),
  getPendingRequestByUserId: vi.fn(),
}))

import { createRoleRequest, getPendingRequestByUserId } from '~/server/db/queries/role-reviews'
import { requestRoleForVisitor } from '~/server/services/visitor'

const makeSession = (role: string | null = 'visitor', id = 'u1') => ({
  user: { id, role },
})

describe('requestRoleForVisitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws 401 when session is null', async () => {
    await expect(requestRoleForVisitor(null, 'teacher')).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 when session has no user id', async () => {
    await expect(requestRoleForVisitor({ user: null }, 'teacher')).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when user role is not visitor', async () => {
    await expect(requestRoleForVisitor(makeSession('student'), 'teacher')).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 400 when requested role is invalid', async () => {
    await expect(requestRoleForVisitor(makeSession(), 'admin')).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when requested role is undefined', async () => {
    await expect(requestRoleForVisitor(makeSession(), undefined)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns existing pending request without creating a new one', async () => {
    const existing = { id: 1, userId: 'u1', requestedRole: 'teacher', status: 'pending' }
    vi.mocked(getPendingRequestByUserId).mockResolvedValueOnce(existing as any)

    const result = await requestRoleForVisitor(makeSession(), 'student')

    expect(createRoleRequest).not.toHaveBeenCalled()
    expect(result).toBe(existing)
  })

  it('creates a role request for teacher when no pending exists', async () => {
    vi.mocked(getPendingRequestByUserId).mockResolvedValueOnce(undefined)
    const created = { id: 1, userId: 'u1', requestedRole: 'teacher', status: 'pending' }
    vi.mocked(createRoleRequest).mockResolvedValueOnce(created as any)

    const result = await requestRoleForVisitor(makeSession(), 'teacher')

    expect(createRoleRequest).toHaveBeenCalledWith('u1', 'teacher')
    expect(result).toBe(created)
  })

  it('creates a role request for student when no pending exists', async () => {
    vi.mocked(getPendingRequestByUserId).mockResolvedValueOnce(undefined)
    const created = { id: 2, userId: 'u1', requestedRole: 'student', status: 'pending' }
    vi.mocked(createRoleRequest).mockResolvedValueOnce(created as any)

    const result = await requestRoleForVisitor(makeSession(), 'student')

    expect(createRoleRequest).toHaveBeenCalledWith('u1', 'student')
    expect(result).toBe(created)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test tests/unit/server/services/visitor.test.ts 2>&1 | tail -20
```

Expected: FAIL — `requestRoleForVisitor` not found.

- [ ] **Step 3: Rewrite server/services/visitor.ts**

Replace the entire file:

```ts
import {
  createRoleRequest,
  getPendingRequestByUserId,
  type PickableRole,
  type RoleReview,
} from '~~/server/db/queries/role-reviews'
import type { UserRole } from '~~/server/db/queries/users'

export type VisitorSession = {
  user?: {
    id?: string
    role?: UserRole | null
  } | null
} | null

function serviceError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

export async function requestRoleForVisitor(
  session: VisitorSession,
  role: unknown,
): Promise<RoleReview> {
  if (!session?.user?.id) {
    throw serviceError('Authentication required', 401)
  }

  if (session.user.role !== 'visitor') {
    throw serviceError('Only visitors can request a role', 403)
  }

  if (role !== 'teacher' && role !== 'student') {
    throw serviceError('Role must be teacher or student', 400)
  }

  const existing = await getPendingRequestByUserId(session.user.id)
  if (existing) return existing

  return await createRoleRequest(session.user.id, role as PickableRole)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test tests/unit/server/services/visitor.test.ts 2>&1 | tail -10
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add server/services/visitor.ts tests/unit/server/services/visitor.test.ts
git commit -m "feat: replace pickRoleForVisitor with requestRoleForVisitor"
```

---

### Task 4: Admin role reviews service

**Files:**
- Create: `server/services/admin-role-reviews.ts`
- Create: `tests/unit/server/services/admin-role-reviews.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/server/services/admin-role-reviews.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/server/db/queries/role-reviews', () => ({
  listPendingRoleRequests: vi.fn(),
  getRoleRequestById: vi.fn(),
  updateRoleRequestStatus: vi.fn(),
}))

vi.mock('~/server/db/queries/users', () => ({
  updateUserRole: vi.fn(),
}))

import { listPendingRoleRequests, getRoleRequestById, updateRoleRequestStatus } from '~/server/db/queries/role-reviews'
import { updateUserRole } from '~/server/db/queries/users'
import { listPendingRequestsForAdmin, approveRoleRequest, rejectRoleRequest } from '~/server/services/admin-role-reviews'

const adminSession = { user: { id: 'admin1', role: 'admin' as const } }
const studentSession = { user: { id: 'u1', role: 'student' as const } }

describe('listPendingRequestsForAdmin', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws 403 for non-admin', async () => {
    await expect(listPendingRequestsForAdmin(studentSession)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns pending requests for admin', async () => {
    const requests = [{ id: 1, requestedRole: 'teacher', user: { email: 'a@b.com' } }]
    vi.mocked(listPendingRoleRequests).mockResolvedValueOnce(requests as any)

    const result = await listPendingRequestsForAdmin(adminSession)

    expect(listPendingRoleRequests).toHaveBeenCalled()
    expect(result).toBe(requests)
  })
})

describe('approveRoleRequest', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws 403 for non-admin', async () => {
    await expect(approveRoleRequest(studentSession, 1)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 404 when request not found', async () => {
    vi.mocked(getRoleRequestById).mockResolvedValueOnce(undefined)
    await expect(approveRoleRequest(adminSession, 999)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 409 when request is already approved', async () => {
    vi.mocked(getRoleRequestById).mockResolvedValueOnce({ id: 1, status: 'approved', userId: 'u1', requestedRole: 'teacher' } as any)
    await expect(approveRoleRequest(adminSession, 1)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 409 when request is already rejected', async () => {
    vi.mocked(getRoleRequestById).mockResolvedValueOnce({ id: 1, status: 'rejected', userId: 'u1', requestedRole: 'teacher' } as any)
    await expect(approveRoleRequest(adminSession, 1)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('updates user role and marks request approved', async () => {
    const request = { id: 1, status: 'pending', userId: 'u1', requestedRole: 'teacher' }
    const user = { id: 'u1', role: 'teacher', email: 'a@b.com' }
    const review = { id: 1, status: 'approved' }
    vi.mocked(getRoleRequestById).mockResolvedValueOnce(request as any)
    vi.mocked(updateUserRole).mockResolvedValueOnce(user as any)
    vi.mocked(updateRoleRequestStatus).mockResolvedValueOnce(review as any)

    const result = await approveRoleRequest(adminSession, 1)

    expect(updateUserRole).toHaveBeenCalledWith('u1', 'teacher')
    expect(updateRoleRequestStatus).toHaveBeenCalledWith(1, 'approved', 'admin1')
    expect(result).toEqual({ review, user })
  })
})

describe('rejectRoleRequest', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws 403 for non-admin', async () => {
    await expect(rejectRoleRequest(studentSession, 1)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 404 when request not found', async () => {
    vi.mocked(getRoleRequestById).mockResolvedValueOnce(undefined)
    await expect(rejectRoleRequest(adminSession, 999)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 409 when request is not pending', async () => {
    vi.mocked(getRoleRequestById).mockResolvedValueOnce({ id: 1, status: 'rejected', userId: 'u1', requestedRole: 'teacher' } as any)
    await expect(rejectRoleRequest(adminSession, 1)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('marks request rejected without touching user role', async () => {
    const request = { id: 1, status: 'pending', userId: 'u1', requestedRole: 'teacher' }
    const review = { id: 1, status: 'rejected' }
    vi.mocked(getRoleRequestById).mockResolvedValueOnce(request as any)
    vi.mocked(updateRoleRequestStatus).mockResolvedValueOnce(review as any)

    const result = await rejectRoleRequest(adminSession, 1)

    expect(updateUserRole).not.toHaveBeenCalled()
    expect(updateRoleRequestStatus).toHaveBeenCalledWith(1, 'rejected', 'admin1')
    expect(result).toBe(review)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test tests/unit/server/services/admin-role-reviews.test.ts 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create server/services/admin-role-reviews.ts**

```ts
import {
  listPendingRoleRequests,
  getRoleRequestById,
  updateRoleRequestStatus,
  type RoleReview,
  type RoleReviewWithUser,
} from '~~/server/db/queries/role-reviews'
import { updateUserRole, type PublicUser, type UserRole } from '~~/server/db/queries/users'
import { assertAdminSession, type AdminSession } from '~~/server/services/admin-users'

function serviceError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

export async function listPendingRequestsForAdmin(
  session: AdminSession,
): Promise<RoleReviewWithUser[]> {
  assertAdminSession(session)
  return await listPendingRoleRequests()
}

export async function approveRoleRequest(
  session: AdminSession,
  requestId: number,
): Promise<{ review: RoleReview; user: PublicUser }> {
  const admin = assertAdminSession(session)

  const request = await getRoleRequestById(requestId)
  if (!request) throw serviceError('Request not found', 404)
  if (request.status !== 'pending') throw serviceError('Request is not pending', 409)

  const user = await updateUserRole(request.userId, request.requestedRole as UserRole)
  if (!user) throw serviceError('User not found', 404)

  const review = await updateRoleRequestStatus(requestId, 'approved', admin.id)
  return { review: review!, user }
}

export async function rejectRoleRequest(
  session: AdminSession,
  requestId: number,
): Promise<RoleReview> {
  const admin = assertAdminSession(session)

  const request = await getRoleRequestById(requestId)
  if (!request) throw serviceError('Request not found', 404)
  if (request.status !== 'pending') throw serviceError('Request is not pending', 409)

  const review = await updateRoleRequestStatus(requestId, 'rejected', admin.id)
  return review!
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test tests/unit/server/services/admin-role-reviews.test.ts 2>&1 | tail -10
```

Expected: 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add server/services/admin-role-reviews.ts tests/unit/server/services/admin-role-reviews.test.ts
git commit -m "feat: add admin role reviews service"
```

---

### Task 5: Visitor API endpoints

**Files:**
- Modify: `server/api/visitor/role.post.ts`
- Create: `server/api/visitor/role-request.get.ts`

The `role.post.ts` now returns a `RoleReview` (the pending record) instead of a `PublicUser`. The new GET endpoint returns the current visitor's pending request, or `null` if none exists.

- [ ] **Step 1: Update server/api/visitor/role.post.ts**

Replace the entire file:

```ts
import { auth } from '~~/server/utils/better-auth'
import { requestRoleForVisitor } from '~~/server/services/visitor'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: toWebRequest(event).headers,
  })
  const body = await readBody<{ role?: unknown }>(event)
  try {
    return await requestRoleForVisitor(session, body.role)
  } catch (err: unknown) {
    if (err instanceof Error && 'statusCode' in err) {
      throw createError({
        statusCode: (err as { statusCode: number }).statusCode,
        message: err.message,
      })
    }
    throw err
  }
})
```

- [ ] **Step 2: Create server/api/visitor/role-request.get.ts**

```ts
import { auth } from '~~/server/utils/better-auth'
import { getPendingRequestByUserId } from '~~/server/db/queries/role-reviews'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: toWebRequest(event).headers,
  })

  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const request = await getPendingRequestByUserId(session.user.id)
  return request ?? null
})
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm nuxt typecheck 2>&1 | grep -E "role\.post|role-request" | head -10
```

Expected: no errors for these two files.

- [ ] **Step 4: Commit**

```bash
git add server/api/visitor/role.post.ts server/api/visitor/role-request.get.ts
git commit -m "feat: update visitor role endpoint and add role-request GET"
```

---

### Task 6: Admin role reviews API endpoints

**Files:**
- Create: `server/api/admin/role-reviews/index.get.ts`
- Create: `server/api/admin/role-reviews/[id]/approve.post.ts`
- Create: `server/api/admin/role-reviews/[id]/reject.post.ts`

All three endpoints follow the same pattern as the existing admin endpoints: get session, call service, wrap serviceError → createError.

- [ ] **Step 1: Create server/api/admin/role-reviews/index.get.ts**

```ts
import { auth } from '~~/server/utils/better-auth'
import { listPendingRequestsForAdmin } from '~~/server/services/admin-role-reviews'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: toWebRequest(event).headers,
  })
  try {
    return await listPendingRequestsForAdmin(session)
  } catch (err: unknown) {
    if (err instanceof Error && 'statusCode' in err) {
      throw createError({
        statusCode: (err as { statusCode: number }).statusCode,
        message: err.message,
      })
    }
    throw err
  }
})
```

- [ ] **Step 2: Create server/api/admin/role-reviews/[id]/approve.post.ts**

```ts
import { auth } from '~~/server/utils/better-auth'
import { approveRoleRequest } from '~~/server/services/admin-role-reviews'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: toWebRequest(event).headers,
  })
  const id = getRouterParam(event, 'id')
  if (!id || Number.isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Valid request id is required' })
  }
  try {
    return await approveRoleRequest(session, Number(id))
  } catch (err: unknown) {
    if (err instanceof Error && 'statusCode' in err) {
      throw createError({
        statusCode: (err as { statusCode: number }).statusCode,
        message: err.message,
      })
    }
    throw err
  }
})
```

- [ ] **Step 3: Create server/api/admin/role-reviews/[id]/reject.post.ts**

```ts
import { auth } from '~~/server/utils/better-auth'
import { rejectRoleRequest } from '~~/server/services/admin-role-reviews'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: toWebRequest(event).headers,
  })
  const id = getRouterParam(event, 'id')
  if (!id || Number.isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Valid request id is required' })
  }
  try {
    return await rejectRoleRequest(session, Number(id))
  } catch (err: unknown) {
    if (err instanceof Error && 'statusCode' in err) {
      throw createError({
        statusCode: (err as { statusCode: number }).statusCode,
        message: err.message,
      })
    }
    throw err
  }
})
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm nuxt typecheck 2>&1 | grep "role-reviews" | head -10
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add server/api/admin/role-reviews/
git commit -m "feat: add admin role reviews API endpoints"
```

---

### Task 7: useAdminRoleReviews composable

**Files:**
- Create: `app/composables/useAdminRoleReviews.ts`
- Create: `tests/unit/composables/useAdminRoleReviews.test.ts`

Pattern: identical to `useAdminUsers` — `shallowRef`, per-item processing set, error string.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/composables/useAdminRoleReviews.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test tests/unit/composables/useAdminRoleReviews.test.ts 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create app/composables/useAdminRoleReviews.ts**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test tests/unit/composables/useAdminRoleReviews.test.ts 2>&1 | tail -10
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/composables/useAdminRoleReviews.ts tests/unit/composables/useAdminRoleReviews.test.ts
git commit -m "feat: add useAdminRoleReviews composable"
```

---

### Task 8: Admin role reviews page

**Files:**
- Create: `app/pages/admin/role-reviews.vue`

This page lists pending role requests with Approve and Reject buttons. It follows the same layout/grid pattern as `app/pages/admin/index.vue`.

- [ ] **Step 1: Create app/pages/admin/role-reviews.vue**

```vue
<script setup lang="ts">
import { onMounted } from 'vue'

definePageMeta({
  role: 'admin',
})

const { reviews, loading, error, loadReviews, isProcessing, approve, reject } = useAdminRoleReviews()

onMounted(() => {
  void loadReviews()
})
</script>

<template>
  <UContainer class="py-8">
    <UPageHeader
      title="Role Requests"
      description="Approve or reject role requests from new users."
    />

    <UAlert
      v-if="error"
      color="error"
      :description="error"
      class="mb-4"
    />

    <div
      v-if="loading && reviews.length === 0"
      class="px-4 py-6 text-sm text-muted"
    >
      Loading requests...
    </div>

    <div
      v-else-if="!loading && reviews.length === 0"
      class="px-4 py-6 text-sm text-muted"
    >
      No pending role requests.
    </div>

    <div
      v-else
      class="rounded-lg border border-default overflow-hidden"
    >
      <div class="grid grid-cols-[1fr_140px_180px] gap-4 bg-muted px-4 py-3 text-sm font-medium text-muted">
        <span>User</span>
        <span>Requested Role</span>
        <span>Actions</span>
      </div>

      <div
        v-for="review in reviews"
        :key="review.id"
        class="grid grid-cols-[1fr_140px_180px] gap-4 border-t border-default px-4 py-3 items-center"
      >
        <div class="min-w-0">
          <p class="truncate font-medium">
            {{ review.user.name || 'Unnamed user' }}
          </p>
          <p class="truncate text-sm text-muted">
            {{ review.user.email }}
          </p>
        </div>

        <UBadge
          color="neutral"
          variant="subtle"
          class="w-fit capitalize"
        >
          {{ review.requestedRole }}
        </UBadge>

        <div class="flex gap-2">
          <UButton
            size="sm"
            color="success"
            :loading="isProcessing(review.id)"
            @click="approve(review.id)"
          >
            Approve
          </UButton>
          <UButton
            size="sm"
            color="error"
            variant="outline"
            :loading="isProcessing(review.id)"
            @click="reject(review.id)"
          >
            Reject
          </UButton>
        </div>
      </div>
    </div>
  </UContainer>
</template>
```

- [ ] **Step 2: Add a link to role-reviews from the admin index page**

Open `app/pages/admin/index.vue`. After the closing `</UPageHeader>` tag and before the UAlert, add a link:

```vue
    <div class="mb-6">
      <UButton
        to="/admin/role-reviews"
        variant="outline"
        size="sm"
      >
        View Role Requests
      </UButton>
    </div>
```

So the template section becomes:

```vue
<template>
  <UContainer class="py-8">
    <UPageHeader
      title="Admin"
      description="Manage user roles."
    />

    <div class="mb-6">
      <UButton
        to="/admin/role-reviews"
        variant="outline"
        size="sm"
      >
        View Role Requests
      </UButton>
    </div>

    <UAlert
      v-if="error"
      ...
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm nuxt typecheck 2>&1 | grep "role-reviews.vue" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/pages/admin/role-reviews.vue app/pages/admin/index.vue
git commit -m "feat: add admin role reviews page"
```

---

### Task 9: Update visitor/role_pick.vue for pending state

**Files:**
- Modify: `app/pages/visitor/role_pick.vue`

The page now has three states:
1. **Loading** — checking for an existing pending request on mount
2. **Pending** — a pending request already exists; show confirmation UI and a "Check Status" button that refreshes the session and redirects if approved
3. **Pick** — no pending request; show the teacher/student buttons (same as before)

After a successful POST, the response is a `RoleReview` record (not a user). We store it to switch to the pending state.

- [ ] **Step 1: Replace app/pages/visitor/role_pick.vue**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authClient } from '../../utils/auth-client'

definePageMeta({
  layout: 'default',
})

interface PendingRequest {
  id: number
  requestedRole: string
  createdAt: string
}

const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const pendingRequest = ref<PendingRequest | null>(null)

onMounted(async () => {
  try {
    const data = await $fetch<PendingRequest | null>('/api/visitor/role-request')
    pendingRequest.value = data
  } catch {
    // No pending request or not authenticated; stay in pick state
  } finally {
    loading.value = false
  }
})

async function pick(role: 'teacher' | 'student') {
  if (submitting.value) return
  submitting.value = true
  error.value = ''

  try {
    const result = await $fetch<PendingRequest>('/api/visitor/role', {
      method: 'POST',
      body: { role },
    })
    pendingRequest.value = result
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to submit request. Please try again.'
  } finally {
    submitting.value = false
  }
}

async function checkApproval() {
  const session = await authClient.getSession()
  const role = session.data?.user?.role as string | undefined
  if (role && role !== 'visitor') {
    await navigateTo(role === 'teacher' ? '/teacher' : '/student', { replace: true })
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="text-center max-w-sm w-full">

      <!-- Loading -->
      <template v-if="loading">
        <p class="text-muted">
          Loading...
        </p>
      </template>

      <!-- Pending state -->
      <template v-else-if="pendingRequest">
        <UIcon
          name="i-heroicons-clock"
          class="text-warning w-16 h-16 mx-auto mb-6"
        />
        <h1 class="text-3xl font-bold mb-2">
          Request Submitted
        </h1>
        <p class="text-muted mb-8">
          Your request to become a
          <strong class="capitalize">{{ pendingRequest.requestedRole }}</strong>
          is pending admin approval. You'll get access once an admin reviews your request.
        </p>
        <UButton
          variant="outline"
          @click="checkApproval"
        >
          Check Approval Status
        </UButton>
      </template>

      <!-- Pick role -->
      <template v-else>
        <h1 class="text-3xl font-bold mb-2">
          Welcome!
        </h1>
        <p class="text-muted mb-8">
          Tell us who you are to get started.
        </p>

        <UAlert
          v-if="error"
          color="error"
          :description="error"
          class="mb-6 text-left"
        />

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            size="xl"
            class="flex-1"
            :loading="submitting"
            @click="pick('teacher')"
          >
            I'm a Teacher
          </UButton>

          <UButton
            size="xl"
            color="neutral"
            variant="outline"
            class="flex-1"
            :loading="submitting"
            @click="pick('student')"
          >
            I'm a Student
          </UButton>
        </div>
      </template>

    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm nuxt typecheck 2>&1 | grep "role_pick.vue" | head -10
```

Expected: no errors.

- [ ] **Step 3: Run all tests to confirm nothing is broken**

```bash
pnpm test 2>&1 | tail -20
```

Expected: all previously-passing tests still pass. (Pre-existing `calendar-pages.test.ts` failures are unrelated to this feature.)

- [ ] **Step 4: Commit**

```bash
git add app/pages/visitor/role_pick.vue
git commit -m "feat: update role_pick page for pending request state"
```

---

## Self-Review

**Spec coverage checklist:**
- ✅ Visitor submits role request → creates `role_reviews` record (Task 1–5)
- ✅ Visitor cannot directly update their own role (Task 3 — `requestRoleForVisitor` no longer calls `updateUserRole`)
- ✅ Admin lists pending requests (Task 4–6)
- ✅ Admin approves → user role updated + request marked approved (Task 4, 6)
- ✅ Admin rejects → request marked rejected, user stays visitor (Task 4, 6)
- ✅ Admin UI page for reviewing requests (Task 8)
- ✅ Visitor sees pending confirmation after submitting (Task 9)
- ✅ Visitor can check if approved and get redirected (Task 9 — `checkApproval`)
- ✅ Duplicate submissions are idempotent — returns existing pending request (Task 3)

**Type consistency:**
- `PickableRole = 'teacher' | 'student'` defined in `role-reviews.ts`, re-exported and used in `visitor.ts`
- `RoleReview = typeof roleReviews.$inferSelect` used in service and API return types
- `RoleReviewWithUser` used in service, composable, and page
- `id: number` (serial PK) used consistently in `approve(id: number)` and `reject(id: number)`
- Admin service imports `assertAdminSession` from `admin-users.ts` (no duplication)
