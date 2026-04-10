# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start dev server with Turbopack
bun build        # Production build
bun lint         # ESLint
bun typecheck    # TypeScript type check (tsc --noEmit)
bun format       # Prettier format all TS/TSX files
```

## Architecture

Next.js 16 App Router project with shadcn/ui (radix-nova style), Tailwind CSS v4, and React 19.

- `app/` — App Router pages and layouts. `layout.tsx` wraps everything in `ThemeProvider` and applies Manrope (sans) + Geist Mono fonts via CSS variables.
- `components/ui/` — shadcn/ui components (add via `npx shadcn@latest add <component>`).
- `components/theme-provider.tsx` — Wraps `next-themes`. Includes a `ThemeHotkey` component that toggles dark/light mode with the `d` key.
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge).
- `hooks/` — Custom React hooks (currently empty).

## shadcn/ui Config

Configured in `components.json`: style `radix-nova`, base color `mist`, CSS variables enabled, icon library `lucide`. Aliases: `@/components`, `@/lib`, `@/hooks`.
