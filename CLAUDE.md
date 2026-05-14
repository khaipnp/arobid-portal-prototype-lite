# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install       # Install dependencies
bun dev           # Start dev server with Turbopack on NEXT_PUBLIC_PORT or 1995
bun build         # Production build
bun start         # Start production server
bun check         # Biome lint + format + import organization with write fixes
bun lint          # Biome lint with write fixes
bun format        # Biome format with write fixes
bun typecheck     # TypeScript type check (tsc --noEmit)
```

Seed and fixture scripts:

```bash
bun tradexpo:seed
bun evoucher:seed
bun platform:seed
bun platform:seed:live-exhibitors
bun platform:seed:seller-demo-expos
bun platform:seed:exhibitor-categories
bun notifications:seed
bun scripts/test-r2.ts
```

Tests are plain TypeScript/Bun test files where present:

```bash
bun test lib/platform/ensure-schema.test.ts
bun test lib/notifications/service.test.ts
bun test lib/notifications/validation.test.ts
```

## Project Shape

Next.js 16 App Router prototype using React 19, TypeScript, Bun, Tailwind CSS v4, Biome, and shadcn/ui (`radix-nova`, `mist`, Lucide icons). The app now includes API routes and persistence helpers, not only mock state.

- `app/` — App Router pages and route handlers. Route groups separate dashboard surfaces from public Tradexpo pages.
- `app/(dashboard)/admin`, `partner`, `seller` — role-oriented dashboards.
- `app/(tradexpo)/expos` — public/visitor exhibition pages.
- `app/api/` — feature API route handlers for auth, Tradexpo, partner, seller, orders, notifications, streaming, wishlist, platform assets/uploads, and deal rooms.
- `components/ui/` — shadcn/ui primitives. Add new primitives through the shadcn CLI so generated code matches `components.json`.
- `components/{tradexpo,seller,partner,orders,evoucher,notifications,...}` — feature components for each product area.
- `lib/{feature}/` — feature data access, services, validation, domain types, and utilities.
- `scripts/` — seed scripts plus reusable fixtures.
- `wiki/` — product/domain notes and user stories; link to these rather than duplicating requirements in code comments.

## Application Architecture

The root layout is in `app/layout.tsx`. Keep the theme provider shell and `suppressHydrationWarning` behavior intact. Global styles and design tokens live in `app/globals.css`.

Dashboard pages are organized by role and commonly compose shared navigation/sidebar components with feature-specific client managers. Heavy interactive managers are usually client components that call API routes or initialize local state from feature data.

Feature modules usually pair:

- `components/<feature>/...` for UI
- `lib/<feature>/...` for data access/services/types/validation
- `app/api/<feature>/...` for route handlers
- `scripts/<feature>/seed.ts` or `scripts/fixtures/*.ts` for demo data

Database access is centralized under `lib/db/neon.ts` and feature `db.ts` files. Platform schema bootstrapping lives in `lib/platform/ensure-schema.ts`. Object storage/R2 helpers live in `lib/platform/r2.ts`. Treat API route handlers and script entry points as system boundaries for validation and environment assumptions.

## Product Areas

- **Tradexpo** — exhibition management, public expo pages, hall/booth templates, exhibitors, live/go-live events, and chat. Core types/utilities live in `lib/tradexpo/`; admin UI is under `app/(dashboard)/admin/tradexpo` and `components/tradexpo/`.
- **Partner portal** — organizer-facing expo operations, bundles, communications, enterprises, finance, quotas, analytics, and partner notifications. UI lives in `app/(dashboard)/partner` and `components/partner`; data helpers in `lib/partner/db.ts`.
- **Seller portal** — exhibitor workflows for my expos, booth customization, products, orders, wishlist, deal room, checkout demo, host dashboard, and notifications.
- **Orders/eVoucher/deal-room/streaming/notifications** — each has its own component and lib/API surface where applicable.
- **Auth/RBAC** — session, login/logout, quick registration, API user lookup, and RBAC helpers live in `lib/auth` and `app/api/auth`.

## Code Style and UI Conventions

Biome is authoritative: 2 spaces, double quotes, no semicolons, 80-column formatting, organized imports, and sorted Tailwind classes in `cn`, `cva`, `clsx`, and `twMerge` call sites.

Use `@/*` aliases instead of deep relative imports where practical. Shared utility composition is `cn()` from `lib/utils.ts`. Variant-heavy UI components should follow the `components/ui/button.tsx` pattern: `cva` variants, `cn`, and optional `asChild` when appropriate.

Theme integration is in `components/theme-provider.tsx` via `next-themes`; preserve the typing-target guards around the `d` hotkey so typing does not toggle themes.

When matching existing UI, use design tokens and CSS variables from `app/globals.css` instead of hardcoded colors.
