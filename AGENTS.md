# Repository Guidelines

## Project Structure & Module Organization

This is a Nuxt 4 full-stack Vue app for teacher scheduling. Client code lives in `app/`: pages in `app/pages/`, layouts in `app/layouts/`, composables in `app/composables/`, utilities in `app/utils/`, and global CSS in `app/assets/css/main.css`. Server code lives in `server/`: API routes in `server/api/`, auth helpers in `server/utils/`, and Drizzle database code in `server/db/`. Tests are under `tests/unit/` and `tests/integration/`. Static files belong in `public/`; plans and logs are in `docs/superpowers/`.

## Build, Test, and Development Commands

Use `pnpm` for this project.

- `pnpm install` installs dependencies and runs Nuxt prepare.
- `pnpm dev` starts the local dev server at `http://localhost:3000`.
- `pnpm build` creates a production build in `.output/`.
- `pnpm preview` serves the production build locally.
- `pnpm test` runs Vitest.
- `pnpm test:ui` opens the Vitest UI.
- `pnpm test:db` runs database-focused tests under `server/db`.
- `pnpm db:migrate` applies Drizzle migrations.
- `pnpm db:studio` opens Drizzle Studio.

## Coding Style & Naming Conventions

Use TypeScript, Vue 3 Composition API, and `<script setup>` for Vue files. Follow the existing style: two-space indentation, single quotes, no semicolons, and explicit types for exported interfaces and function boundaries where helpful. Prefer Nuxt auto-imports in app code. Use `~/` for app-side imports and `~~/` or server-safe imports for Nitro/server code.

Name composables as `useX.ts`, Vue pages by route segment, and tests as `*.test.ts`.

## Testing Guidelines

Vitest runs in a Node environment with globals enabled and `tests/setup.ts` loaded. Put isolated tests with mocks in `tests/unit/`; use `tests/integration/` for flows that require the real database. Mock Nuxt globals such as `navigateTo` with `vi.stubGlobal`. Run `pnpm test` before submitting changes; run `pnpm test:db` when touching schema, migrations, or query code.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit prefixes such as `feat:`, `test:`, and `docs:`. Keep commits focused, for example `feat: add auth middleware` or `test: expand user query cases`.

Pull requests should include a short description, linked issue or task when available, test commands run, and screenshots for UI changes. Note any database migration, environment variable, or auth behavior change explicitly.

## Security & Configuration Tips

Copy `.env.example` to `.env` for local configuration. Required auth and DB settings include `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`. Do not commit secrets, generated Nuxt output, `node_modules/`, or local database data. Better Auth owns session/account tables; avoid manual writes to them.
