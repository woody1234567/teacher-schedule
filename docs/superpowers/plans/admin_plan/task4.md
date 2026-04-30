# Task 4: Admin UI

## Objective

Create a minimal admin page for verifying user listing and role updates.

## Tests

- `useAdminUsers` loads users from `/api/admin/users`.
- `useAdminUsers` patches role changes to `/api/admin/users/:id/role`.
- Loading errors are exposed in composable state.

## Implementation Notes

- Add `/admin/index.vue` with `role: 'admin'` route meta.
- Keep the page simple: table-like user rows and role select controls.
