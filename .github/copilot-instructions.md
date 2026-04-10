# Project Guidelines

## Code Style
- Use TypeScript and React function components.
- Follow existing formatting conventions: 2 spaces, no semicolons, double quotes.
- Keep Tailwind class composition in `cn()`/`cva()` call sites so Prettier Tailwind sorting stays consistent.
- Prefer import aliases (`@/*`) instead of deep relative imports when possible.

## Architecture
- This is a Next.js App Router project (`app/`) with React 19 and Next.js 16.
- Root app shell is in `app/layout.tsx` and must keep `ThemeProvider` wrapping plus `suppressHydrationWarning` on `<html>`.
- Shared UI lives in `components/ui/` (shadcn/ui, radix-nova style).
- Theme integration is in `components/theme-provider.tsx` using `next-themes` and a `d` hotkey toggle.
- Shared utility helpers live in `lib/` (especially `lib/utils.ts` for `cn()`).

## Build and Test
- Install dependencies: `bun install`
- Dev server: `bun dev` (uses Turbopack)
- Production build: `bun build`
- Start production server: `bun start`
- Lint: `bun lint`
- Type check: `bun typecheck`
- Format TS/TSX: `bun format`

## Conventions
- For new primitives/components, use shadcn CLI (`npx shadcn@latest add <component>`) so generated code matches project config.
- Keep `components.json` settings aligned with existing UI system (style `radix-nova`, base color `mist`, CSS variables enabled).
- When creating or editing variant-heavy UI components, follow the pattern in `components/ui/button.tsx` (`cva` + `cn` + optional `asChild`).
- Keep design tokens and theme variables centralized in `app/globals.css`; avoid hardcoding colors when matching existing tokens.
- Preserve typing-target guards in theme hotkey behavior (`components/theme-provider.tsx`) to avoid toggling themes while users type.

## Docs and References
- See `CLAUDE.md` for extended architecture notes and command summary.
- See `README.md` for quick template/shadcn usage basics.
- Product/domain requirements are documented in `wiki/` (user story files); link to those instead of duplicating requirement text in code comments.
