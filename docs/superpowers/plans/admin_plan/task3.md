# Task 3: Admin API Authorization

## Objective

Expose admin-only APIs for listing users and changing roles.

## Tests

- Missing sessions are rejected.
- Non-admin sessions are rejected.
- Admin sessions can list users.
- Admins cannot change their own role.
- Invalid target roles are rejected.

## Implementation Notes

- Add `GET /api/admin/users`.
- Add `PATCH /api/admin/users/:id/role`.
- Resolve session through Better Auth before calling service functions.
