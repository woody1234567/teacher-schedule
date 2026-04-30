# Task 1: Admin Role Model

## Objective

Extend role handling to include `admin` while keeping public registration limited to `student` and `teacher`.

## Tests

- Middleware redirects admin users to `/admin`.
- Middleware protects `/admin` and nested admin routes.
- Auth composable sends admin users to `/admin` after login.

## Implementation Notes

- Update role unions in auth middleware and composables.
- Add `/admin` to path fallback role mapping.
- Keep signup self-selection restricted to non-admin roles.
