# Visitor Role Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** First-time login users receive a `visitor` role, are gated to `/visitor/role_pick` until they pick teacher or student, then land on `/visitor` as a welcome page.

**Architecture:** Add `visitor` as a valid role throughout the type stack. Better Auth's `defaultValue` changes to `visitor` so new Google OAuth users start as visitors. The global auth middleware intercepts any visitor navigating outside `/visitor/role_pick` and redirects them. The role_pick page calls a new `POST /api/visitor/role` endpoint (validated by a visitor service), refreshes the client session, then navigates to `/visitor`. The visitor landing page (`/visitor`) is accessible to any authenticated user — teachers and students reach it only via the role-pick flow.

**Tech Stack:** Nuxt 4, Better Auth (additionalFields + transform), Drizzle ORM, @nuxt/ui, Vitest

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `server/db/queries/users.ts` | Modify | Add `'visitor'` to `UserRole` union |
| `server/services/admin-users.ts` | Modify | Add `'visitor'` to valid roles array |
| `server/utils/better-auth.ts` | Modify | Change `defaultValue` to `'visitor'`, update transform |
| `server/services/visitor.ts` | **Create** | Business logic for role selection (testable) |
| `server/api/visitor/role.post.ts` | **Create** | Thin event handler calling visitor service |
| `tests/unit/server/services/visitor.test.ts` | **Create** | Unit tests for the visitor service |
| `app/composables/useAdminUsers.ts` | Modify | Add `'visitor'` to `AdminUserRole` |
| `app/composables/useAuth.ts` | Modify | Add `'visitor'` to `AuthRole`, update guards, add `refreshSession` |
| `app/middleware/auth.global.ts` | Modify | Redirect visitors to `/visitor/role_pick` |
| `app/pages/visitor/role_pick.vue` | **Create** | Teacher/Student selection UI |
| `app/pages/visitor/index.vue` | **Create** | Post-pick welcome/landing page |
| `app/pages/admin/index.vue` | Modify | Add Visitor option to role dropdown |

---

### Task 1: Add `'visitor'` to server-side role types

**Files:**
- Modify: `server/db/queries/users.ts:5`
- Modify: `server/services/admin-users.ts:15`

- [ ] **Step 1: Update `UserRole` in DB queries**

In `server/db/queries/users.ts`, change line 5:

```ts
export type UserRole = 'student' | 'teacher' | 'admin' | 'visitor'
```

- [ ] **Step 2: Update roles array in admin service**

In `server/services/admin-users.ts`, change line 15:

```ts
const roles = ['student', 'teacher', 'admin', 'visitor'] as const
```

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
cd /home/woody/small_projects/teacher_schedule && pnpm nuxt prepare 2>&1 | tail -5
```

Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add server/db/queries/users.ts server/services/admin-users.ts
git commit -m "feat: add visitor to server-side UserRole type"
```

---

### Task 2: Update Better Auth config for visitor default

**Files:**
- Modify: `server/utils/better-auth.ts:29-37`

The transform was partially fixed in a prior session (it now allows `'admin'`). This task completes it.

- [ ] **Step 1: Update `additionalFields.role` config**

Replace the entire `role` block (lines 29–37) in `server/utils/better-auth.ts`:

```ts
      role: {
        type: 'string',
        required: false,
        defaultValue: 'visitor',
        transform: {
          input: (role: unknown) => {
            const valid = ['student', 'teacher', 'admin', 'visitor']
            return valid.includes(role as string) ? (role as string) : 'visitor'
          },
        },
      },
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm nuxt prepare 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add server/utils/better-auth.ts
git commit -m "feat: default new users to visitor role in Better Auth"
```

---

### Task 3: Create visitor service + unit tests + API endpoint

**Files:**
- Create: `server/services/visitor.ts`
- Create: `tests/unit/server/services/visitor.test.ts`
- Create: `server/api/visitor/role.post.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/server/services/visitor.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/server/db/queries/users', () => ({
  updateUserRole: vi.fn(),
}))

import { updateUserRole } from '~/server/db/queries/users'
import { pickRoleForVisitor } from '~/server/services/visitor'

const mockUpdateUserRole = vi.mocked(updateUserRole)

const visitorSession = {
  user: { id: 'user-1', role: 'visitor' as const },
}

const mockPublicUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: null,
  emailVerified: false,
  image: null,
  role: 'teacher' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('pickRoleForVisitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws 401 when session is null', async () => {
    await expect(pickRoleForVisitor(null, 'teacher')).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('throws 401 when session has no user id', async () => {
    await expect(
      pickRoleForVisitor({ user: { id: undefined, role: 'visitor' } }, 'teacher'),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when user is not a visitor', async () => {
    const session = { user: { id: 'user-1', role: 'student' as const } }
    await expect(pickRoleForVisitor(session, 'teacher')).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('throws 400 when role is admin', async () => {
    await expect(pickRoleForVisitor(visitorSession, 'admin')).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws 400 when role is visitor', async () => {
    await expect(pickRoleForVisitor(visitorSession, 'visitor')).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws 400 when role is an unknown string', async () => {
    await expect(pickRoleForVisitor(visitorSession, 'superadmin')).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws 404 when updateUserRole returns undefined', async () => {
    mockUpdateUserRole.mockResolvedValue(undefined)
    await expect(pickRoleForVisitor(visitorSession, 'teacher')).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('calls updateUserRole with correct args and returns user for teacher', async () => {
    mockUpdateUserRole.mockResolvedValue(mockPublicUser)
    const result = await pickRoleForVisitor(visitorSession, 'teacher')
    expect(mockUpdateUserRole).toHaveBeenCalledWith('user-1', 'teacher')
    expect(result).toEqual(mockPublicUser)
  })

  it('calls updateUserRole with correct args and returns user for student', async () => {
    mockUpdateUserRole.mockResolvedValue({ ...mockPublicUser, role: 'student' })
    const result = await pickRoleForVisitor(visitorSession, 'student')
    expect(mockUpdateUserRole).toHaveBeenCalledWith('user-1', 'student')
    expect(result.role).toBe('student')
  })
})
```

- [ ] **Step 2: Run tests — expect them to fail**

```bash
pnpm test tests/unit/server/services/visitor.test.ts 2>&1 | tail -15
```

Expected: FAIL — `Cannot find module '~/server/services/visitor'`

- [ ] **Step 3: Create the visitor service**

Create `server/services/visitor.ts`:

```ts
import { updateUserRole, type PublicUser, type UserRole } from '~~/server/db/queries/users'

export type VisitorSession = {
  user?: {
    id?: string
    role?: UserRole | null
  } | null
} | null

type PickableRole = 'teacher' | 'student'

function serviceError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

export async function pickRoleForVisitor(
  session: VisitorSession,
  role: unknown,
): Promise<PublicUser> {
  if (!session?.user?.id) {
    throw serviceError('Authentication required', 401)
  }

  if (session.user.role !== 'visitor') {
    throw serviceError('Only visitors can pick a role', 403)
  }

  if (role !== 'teacher' && role !== 'student') {
    throw serviceError('Role must be teacher or student', 400)
  }

  const user = await updateUserRole(session.user.id, role as PickableRole)
  if (!user) {
    throw serviceError('User not found', 404)
  }

  return user
}
```

- [ ] **Step 4: Run tests — expect them to pass**

```bash
pnpm test tests/unit/server/services/visitor.test.ts 2>&1 | tail -15
```

Expected: all 9 tests PASS.

- [ ] **Step 5: Create the API event handler**

Create `server/api/visitor/role.post.ts`:

```ts
import { auth } from '~~/server/utils/better-auth'
import { pickRoleForVisitor } from '~~/server/services/visitor'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: toWebRequest(event).headers,
  })
  const body = await readBody<{ role?: unknown }>(event)
  return await pickRoleForVisitor(session, body.role)
})
```

- [ ] **Step 6: Verify TypeScript**

```bash
pnpm nuxt prepare 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add server/services/visitor.ts server/api/visitor/role.post.ts tests/unit/server/services/visitor.test.ts
git commit -m "feat: add visitor role selection service and API endpoint"
```

---

### Task 4: Update auth middleware for visitor routing

**Files:**
- Modify: `app/middleware/auth.global.ts`

- [ ] **Step 1: Update `AuthRole` type** (line 3)

```ts
type AuthRole = 'student' | 'teacher' | 'admin' | 'visitor'
```

- [ ] **Step 2: Update `getRoleLandingPath`** (lines 21–35 — replace the whole function)

```ts
function getRoleLandingPath(role?: AuthRole | null) {
  if (role === 'admin') return '/admin'
  if (role === 'teacher') return '/teacher'
  if (role === 'student') return '/student'
  if (role === 'visitor') return '/visitor/role_pick'
  return '/'
}
```

- [ ] **Step 3: Add visitor redirect inside `authMiddlewareHandler`**

In `authMiddlewareHandler`, after the `if (!session)` block (line ~87) and before the `routeRoles` check, insert:

```ts
  // Visitors are only allowed on the role-pick page
  if (session.user?.role === 'visitor' && to.path !== '/visitor/role_pick') {
    return navigateTo('/visitor/role_pick', { replace: true })
  }
```

The final `authMiddlewareHandler` should read:

```ts
export async function authMiddlewareHandler(to: RouteLocationNormalized) {
  const meta = to.meta as AuthRouteMeta

  if (meta.auth === false && !to.path.startsWith('/auth')) {
    return
  }

  const session = await getSession()

  if (meta.auth === false) {
    if (session && to.path.startsWith('/auth')) {
      return navigateTo(getRoleLandingPath(session.user?.role), { replace: true })
    }
    return
  }

  if (!session) {
    return navigateTo('/auth/login', { replace: true })
  }

  // Visitors are only allowed on the role-pick page
  if (session.user?.role === 'visitor' && to.path !== '/visitor/role_pick') {
    return navigateTo('/visitor/role_pick', { replace: true })
  }

  const routeRoles = getRouteRoles(to)

  if (routeRoles.length > 0 && !routeRoles.includes(session.user?.role as AuthRole)) {
    return navigateTo(getRoleLandingPath(session.user?.role), { replace: true })
  }
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
pnpm nuxt prepare 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/middleware/auth.global.ts
git commit -m "feat: redirect visitors to role_pick in auth middleware"
```

---

### Task 5: Update client-side auth composable

**Files:**
- Modify: `app/composables/useAuth.ts`

- [ ] **Step 1: Update `AuthRole` type** (line 5)

```ts
type AuthRole = 'student' | 'teacher' | 'admin' | 'visitor'
```

- [ ] **Step 2: Exclude visitor from `RegistrationRole`** (line 6)

```ts
type RegistrationRole = Exclude<AuthRole, 'admin' | 'visitor'>
```

- [ ] **Step 3: Update `isAuthRole`** (lines 18–20)

```ts
function isAuthRole(role: unknown): role is AuthRole {
  return role === 'student' || role === 'teacher' || role === 'admin' || role === 'visitor'
}
```

- [ ] **Step 4: Update `getRoleLandingPath`** (lines 22–36)

```ts
export function getRoleLandingPath(role: AuthRole | null | undefined) {
  if (role === 'admin') return '/admin'
  if (role === 'teacher') return '/teacher'
  if (role === 'student') return '/student'
  if (role === 'visitor') return '/visitor/role_pick'
  return '/'
}
```

- [ ] **Step 5: Add `isVisitor` computed and `refreshSession` to the composable**

Inside `useAuth()`, after the existing computed properties (line ~51), add:

```ts
  const isVisitor = computed(() => (user.value as { role?: AuthRole } | undefined)?.role === 'visitor')
```

Inside `useAuth()`, before the `return` statement, add:

```ts
  async function refreshSession() {
    await authClient.getSession()
  }
```

Update the return object to include both:

```ts
  return {
    session,
    user,
    loading,
    error,
    isAuthenticated,
    isTeacher,
    isStudent,
    isAdmin,
    isVisitor,
    login,
    register,
    signInWithGoogle,
    logout,
    refreshSession,
  }
```

- [ ] **Step 6: Verify TypeScript**

```bash
pnpm nuxt prepare 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/composables/useAuth.ts
git commit -m "feat: add visitor to client auth composable"
```

---

### Task 6: Create `visitor/role_pick.vue`

**Files:**
- Create: `app/pages/visitor/role_pick.vue`

- [ ] **Step 1: Create the page**

Create `app/pages/visitor/role_pick.vue`:

```vue
<script setup lang="ts">
import { authClient } from '../../utils/auth-client'

definePageMeta({
  layout: 'default',
})

const loading = ref(false)
const error = ref('')

async function pick(role: 'teacher' | 'student') {
  if (loading.value) return
  loading.value = true
  error.value = ''

  try {
    await $fetch('/api/visitor/role', {
      method: 'POST',
      body: { role },
    })
    // Refresh the reactive session so visitor/index.vue sees the new role
    await authClient.getSession()
    await navigateTo('/visitor')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to update role. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="text-center max-w-sm w-full">
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
          :loading="loading"
          @click="pick('teacher')"
        >
          I'm a Teacher
        </UButton>

        <UButton
          size="xl"
          color="neutral"
          variant="outline"
          class="flex-1"
          :loading="loading"
          @click="pick('student')"
        >
          I'm a Student
        </UButton>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm nuxt prepare 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/pages/visitor/role_pick.vue
git commit -m "feat: add visitor role_pick page"
```

---

### Task 7: Create `visitor/index.vue`

**Files:**
- Create: `app/pages/visitor/index.vue`

- [ ] **Step 1: Create the page**

Create `app/pages/visitor/index.vue`:

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { user } = useAuth()

const roleLabel = computed(() => {
  if (user.value?.role === 'teacher') return 'Teacher'
  if (user.value?.role === 'student') return 'Student'
  return 'Member'
})

const dashboardPath = computed(() => {
  if (user.value?.role === 'teacher') return '/teacher'
  if (user.value?.role === 'student') return '/student'
  return '/'
})
</script>

<template>
  <UContainer class="py-20">
    <div class="text-center max-w-md mx-auto">
      <UIcon
        name="i-heroicons-check-circle"
        class="text-success w-16 h-16 mx-auto mb-6"
      />

      <h1 class="text-3xl font-bold mb-2">
        You're all set!
      </h1>

      <p class="text-muted mb-8">
        Your role has been set to <strong>{{ roleLabel }}</strong>.
        Head to your dashboard to get started.
      </p>

      <UButton
        :to="dashboardPath"
        size="lg"
      >
        Go to Dashboard
      </UButton>
    </div>
  </UContainer>
</template>
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm nuxt prepare 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/pages/visitor/index.vue
git commit -m "feat: add visitor landing page"
```

---

### Task 8: Update admin panel for visitor role

**Files:**
- Modify: `app/composables/useAdminUsers.ts:3`
- Modify: `app/pages/admin/index.vue:17-22`

- [ ] **Step 1: Add `'visitor'` to `AdminUserRole`**

In `app/composables/useAdminUsers.ts`, change line 3:

```ts
export type AdminUserRole = 'student' | 'teacher' | 'admin' | 'visitor'
```

- [ ] **Step 2: Add Visitor option to the role dropdown in admin page**

In `app/pages/admin/index.vue`, replace `roleOptions` (lines 17–22):

```ts
const roleOptions = [
  { label: 'Visitor', value: 'visitor' },
  { label: 'Student', value: 'student' },
  { label: 'Teacher', value: 'teacher' },
  { label: 'Admin', value: 'admin' },
]
```

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm nuxt prepare 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 4: Run full test suite**

```bash
pnpm test 2>&1 | tail -20
```

Expected: all tests pass (including the visitor service unit tests from Task 3).

- [ ] **Step 5: Commit**

```bash
git add app/composables/useAdminUsers.ts app/pages/admin/index.vue
git commit -m "feat: add visitor role option to admin user management"
```

---

## Flow Summary

```
New Google OAuth login
  → Better Auth creates user with role='visitor' (defaultValue)
  → Middleware sees role='visitor', path='/'
  → Redirect to /visitor/role_pick

/visitor/role_pick
  → User clicks "I'm a Teacher"
  → POST /api/visitor/role { role: 'teacher' }
  → Server: validates visitor session, calls updateUserRole(userId, 'teacher')
  → Client: authClient.getSession() refreshes reactive session
  → navigateTo('/visitor')

/visitor (index)
  → useAuth().user.role === 'teacher'
  → Shows "Your role is Teacher, go to dashboard"
  → UButton :to="/teacher"
```

```
Admin demotes user back to visitor
  → Admin panel dropdown → "Visitor"
  → PATCH /api/admin/users/:id/role { role: 'visitor' }
  → Next time that user navigates → middleware redirects to /visitor/role_pick
```
