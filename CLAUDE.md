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

Tests are plain TypeScript/Bun test files where present. Run all tests with `bun test`, or a single test file with:

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

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->