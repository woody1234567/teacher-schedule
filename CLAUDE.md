# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a minimal **Nuxt 4** full-stack Vue application for teacher scheduling. The project uses:
- **Vue 3** with Composition API
- **Nuxt 4** - meta-framework with built-in SSR, file-based routing, and auto-imports
- **@nuxt/ui** - Headless UI component library
- **Tailwind CSS** - utility-first CSS framework
- **TypeScript** - for type safety
- **pnpm** - package manager

## Development

### Install & Run

```bash
pnpm install    # Install dependencies
pnpm dev        # Start dev server at http://localhost:3000
```

### Build & Preview

```bash
pnpm build      # Build for production (.output directory)
pnpm preview    # Preview production build locally
pnpm generate   # Generate static site (if needed)
```

### Project Structure

- **`app/`** - Application root
  - `app.vue` - Root component (entry point for rendering)
  - `assets/css/main.css` - Global styles (Tailwind)
- **`nuxt.config.ts`** - Nuxt configuration (modules, css imports, etc.)
- **`tsconfig.json`** - References generated Nuxt tsconfig files in `.nuxt/`

Nuxt auto-discovers:
- **`pages/`** directory for file-based routing
- **`components/`** directory for auto-imported Vue components
- **`composables/`** directory for auto-imported composable functions
- **`server/`** directory for server routes and middleware

## Configuration Notes

- **Tailwind CSS 4** is configured via `@nuxt/ui` module integration
- **DevTools** enabled for easier development (`nuxt.config.ts`)
- **Compatibility date** set to `2025-07-15` for Nuxt feature stability
- **TypeScript** references are generated in `.nuxt/` - do not edit manually

## Notes on Current State

- No linting (ESLint), formatting (Prettier), or testing (Vitest) configured yet
- Project is a minimal starter with single `app.vue` component
- Skills installed: nuxt, vue, nuxt-ui, pnpm, vitest, vue-best-practices, web-design-guidelines

## Key Files

- `package.json` - Scripts and dependencies
- `nuxt.config.ts` - Core Nuxt configuration
- `.gitignore` - Standard Nuxt excludes (.nuxt, node_modules, dist, etc.)
