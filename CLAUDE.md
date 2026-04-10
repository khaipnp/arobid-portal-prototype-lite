# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start dev server with Turbopack
bun build        # Production build
bun check        # Biome lint + format (write fixes) — preferred
bun lint         # Biome lint only (write fixes)
bun format       # Biome format only (write fixes)
bun typecheck    # TypeScript type check (tsc --noEmit)
```

## Architecture

Next.js 16 App Router project with shadcn/ui (radix-nova style), Tailwind CSS v4, and React 19. **Prototype only — all data is in-memory mock state, no backend.**

- `app/` — App Router pages and layouts. `layout.tsx` wraps everything in `ThemeProvider` and `TooltipProvider`, applies Manrope (sans) + Geist Mono fonts via CSS variables.
- `components/ui/` — shadcn/ui components (add via `npx shadcn@latest add <component>`).
- `components/tradexpo/` — Domain-specific components for the TradeXpo module.
- `lib/tradexpo/` — Domain logic: `types.ts` (data models), `mock-data.ts` (seed state), `utils.ts` (status derivation, validation, formatting helpers).
- `components/theme-provider.tsx` — Wraps `next-themes`. Includes a `ThemeHotkey` component that toggles dark/light mode with the `d` key.
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge).

## Route Structure

```
/                                           → root page
/dashboard                                  → dashboard index
/dashboard/tradexpo                         → TradeXpo module overview
/dashboard/tradexpo/hall-templates          → Hall Template Library (HallTemplateLibraryManager)
/dashboard/tradexpo/hall-templates/[id]     → Hall template detail + slot manager (HallSlotManager)
/dashboard/tradexpo/booth-templates         → Booth Template Library (BoothTemplateLibraryManager)
```

## TradeXpo Domain

The core domain models are in `lib/tradexpo/types.ts`:

- **`ModelAsset`** — A 3D/image file with async processing status (`pending → processing → ready | failed`). Assets are referenced by ID from templates.
- **`HallTemplate`** — A 3D hall environment. Requires a GLB render file and thumbnail. Has `isPublic` (draft vs published) and `isActive` flags. Supports `TranslationRecord[]` for i18n names.
- **`HallTemplateSlot`** — A positioned slot inside a hall template for placing booths. Has 3D transform (pos/rot/scale) and dimensions. Slots belong to a hall template by ID.
- **`BoothTemplate`** — A 3D booth design, similar structure to `HallTemplate`, additionally linked to a `BoothType`.
- **`TemplateDerivedStatus`** — Computed from asset statuses + flags: `Inactive | Draft | Published | Processing | Failed`. See `getHallTemplateStatus` / `getBoothTemplateStatus` in `lib/tradexpo/utils.ts`.

## Page/Component Composition Pattern

All dashboard pages use `DashboardShell` (in `components/tradexpo/dashboard-shell.tsx`) which composes the `AppSidebar` with `SidebarInset`. Pages pass `title`, `description`, and `breadcrumbs` props.

The heavy "manager" components (`HallTemplateLibraryManager`, `BoothTemplateLibraryManager`, `HallSlotManager`) are `"use client"` and own their local state initialized from `lib/tradexpo/mock-data.ts`. Each clones mock data on mount so resets happen on page reload.

## shadcn/ui Config

Configured in `components.json`: style `radix-nova`, base color `mist`, CSS variables enabled, icon library `lucide`. Aliases: `@/components`, `@/lib`, `@/hooks`.
