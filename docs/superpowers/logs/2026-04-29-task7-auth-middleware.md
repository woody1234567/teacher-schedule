# Task 7: Auth Middleware / Route Guards — 2026-04-29

## What was built

Global Nuxt route middleware that protects routes using Better Auth session, plus an auth-aware layout header.

## Files created / modified

| Action | File | Description |
|--------|------|-------------|
| Created | `app/middleware/auth.global.ts` | Global middleware — checks session, redirects unauthenticated users |
| Created | `tests/unit/middleware/auth.test.ts` | 6 unit tests for the middleware handler |
| Created | `tests/setup.ts` | Vitest setup file — stubs Nuxt globals (`defineNuxtRouteMiddleware`, `navigateTo`) |
| Modified | `vitest.config.ts` | Added `setupFiles: ['./tests/setup.ts']` |
| Modified | `app/layouts/default.vue` | Auth-aware header: shows user name + Logout when signed in |
| Modified | `app/pages/index.vue` | Added `auth: false` to `definePageMeta` (public landing page) |

## Design decisions

### Global middleware + `auth: false` opt-out
Routes are **protected by default**. Pages opt out of auth protection by adding `auth: false` to `definePageMeta`. This matches the pattern already used by `app/pages/auth/login.vue` and `app/pages/auth/register.vue`.

### Exported `authMiddlewareHandler` for testing
`defineNuxtRouteMiddleware` is a Nuxt auto-import global unavailable in vitest. Exporting the inner handler function separately lets tests call it directly without needing to stub the wrapper at module-load time.

### Vitest setup file for Nuxt globals
Added `tests/setup.ts` that stubs `defineNuxtRouteMiddleware` and `navigateTo` as globals. This is required so middleware module-level code doesn't throw a `ReferenceError` on import.

## Middleware behavior

```
Route has auth: false?
  ├─ YES + user signed in + path starts with /auth → navigateTo('/', { replace: true })
  ├─ YES + (user not signed in OR not /auth path)  → allow through
  └─ NO + user not signed in                       → navigateTo('/auth/login', { replace: true })
      + user is signed in                          → allow through
```

## Test results

```
Tests  37 passed (37)  — composables + middleware + auth unit tests
Build  ✨ Build complete!
```

## Next

Task 8 / Phase 2: Calendar management system (CalendarEvents DB table, teacher calendar CRUD API, calendar UI).
