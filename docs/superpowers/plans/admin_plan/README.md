# Admin Role Plan

## Goal

Add an `admin` role that can view all users and update another user's role. Development must follow TDD with Vitest unit tests, using integration tests only when the database is required.

## Scope

- Extend the app role model from `student | teacher` to `student | teacher | admin`.
- Keep registration defaults as `student`; admin assignment should happen through database seed/manual update or an existing admin.
- Protect `/admin` routes and admin APIs so only admins can access them.
- Provide APIs to list users and update user roles.
- Add a minimal `/admin/index.vue` page for route and API workflow testing.

## TDD Tasks

### Task 1: Role Model

Write tests for role landing paths and middleware role matching. Then update shared role types and route fallback mapping so `admin` users land on `/admin`.

### Task 2: User Query Capabilities

Write unit tests for listing users and updating only the `role` field. Then add query functions in `server/db/queries/users.ts` with a safe public user shape that excludes auth secrets.

### Task 3: Admin API Authorization

Write unit tests for admin service behavior: reject unauthenticated users, reject non-admin users, list all users for admins, and prevent admins from changing their own role. Then implement admin helpers and Nitro API routes:

- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/role`

### Task 4: Admin UI

Write composable tests for fetching users and updating roles. Then add a minimal `/admin/index.vue` page that lists users and lets admins change roles.

## Verification

Run focused tests first:

```bash
pnpm vitest tests/unit/middleware/auth.test.ts tests/unit/composables/useAuth.test.ts
```

Then run admin-focused tests:

```bash
pnpm vitest tests/unit/db/queries/users.test.ts tests/unit/server/admin-users.test.ts tests/unit/composables/useAdminUsers.test.ts
```

Finish with:

```bash
pnpm build
```

## Notes

The first admin account must be promoted outside this UI, for example by a database update, before the admin screen can be used.
