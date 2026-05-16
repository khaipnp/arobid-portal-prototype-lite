# Figma Live Preview for Partner Site Management

## Goal

Replace the Partner Portal Site Management live preview with the Figma layout from node `45:73441` in file `TwM4qFmdpgQQabBaytiQFS`. Stakeholders should see immediate visual changes when the partner updates brand colors, logo, or optional homepage sections.

## Scope

The implementation targets Partner Portal -> Site Management only.

Always visible sections:

- Header
- Banner
- Buyer Find & Match
- Footer

Toggleable sections:

- Community / value cards
- Browse by Categories
- Featured Suppliers
- Hot Deal / Brand eVoucher
- Hot Products
- Expo banner carousel
- New Products
- Recommended Suppliers
- Large promo/content block
- Three feature cards
- Our Partners
- CTA

Out of scope:

- Runtime sync with Figma
- Persistence of site settings unless existing Site Management state already persists similar settings
- Toggle controls for Header, Footer, Banner, or Buyer Find & Match
- Adding media files to the repository

## Architecture

`components/partner/partner-site-management-manager.tsx` remains the page-level editor shell and owns state for:

- `logoUrl`
- brand colors for brand-colored buttons, headings, and titles
- enabled section keys

Add an extracted preview module under `components/partner/site-preview/`:

- `site-live-preview.tsx` renders the preview container and section order.
- `site-preview-controls.tsx` renders logo upload, color inputs, and section toggles.
- `sections/*.tsx` contains focused components for major Figma sections.
- `types.ts` defines preview props and section keys.
- `constants.ts` defines defaults, section registry, and sample content.

The manager passes state into controls and preview. Section components stay presentational and receive only the data/theme props they need.

## Data Flow

Brand color controls update preview state immediately. The preview root exposes CSS variables:

- `--site-primary`
- `--site-accent`

Section components consume those variables only for elements that are brand-colored in the design, such as buttons, headings, titles, and accent badges. Brand color controls must not recolor the whole preview surface, body text, neutral cards, or non-brand layout backgrounds.

Section toggles update an `enabledSections` map. `site-live-preview.tsx` filters the section registry before rendering. Hidden sections are removed from document flow, leaving no blank gap.

Logo upload uses the existing platform upload flow: request a signed upload URL, upload the file to R2, and use the returned public URL in preview state. If the existing upload hook persists asset metadata, reuse it. On upload failure, show an inline error and keep the previous logo.

Figma media assets must not be committed to the repository. Any required design images should be uploaded to R2 and referenced by URL in preview constants/sample data.

## UI Behavior

Site Management becomes a two-column workspace:

- Left column: controls for logo, brand colors, and toggleable sections.
- Right column: scrollable live preview frame using the Figma layout.

Preview updates instantly when:

- a section toggle changes
- a brand color input changes
- logo upload completes

Fallbacks:

- Missing logo displays a text or generated brand mark.
- Failed logo upload shows inline error and preserves the old logo.
- Missing sample images use existing R2 URLs or non-media visual treatment, not local repo images.

## Figma Section Mapping

The source Figma node contains these major sections:

1. Header
2. Banner
3. Community / value cards
4. Browse by Categories
5. Buyer Find & Match
6. Featured Suppliers
7. Hot Deal / Brand eVoucher
8. Hot Products
9. Expo banner carousel
10. New Products
11. Recommended Suppliers
12. Large promo/content block
13. Three feature cards
14. Our Partners
15. CTA
16. Footer

Implementation should preserve visual order from Figma.

## Testing

Verification steps:

- Run `bun typecheck`.
- Run `bun check` if changes are broad enough to need formatter/lint cleanup.
- Start `bun dev`.
- Browser-test Partner Portal -> Site Management.
- Verify section toggles remove and restore sections without gaps.
- Verify brand color controls update only brand-colored buttons, headings, titles, and accents.
- Verify logo upload uses R2 if environment variables are configured. If R2 is unavailable, verify the failure state and fallback logo behavior.

## Acceptance Criteria

- Partner Portal -> Site Management live preview is replaced by the Figma-derived layout.
- Header, Banner, Buyer Find & Match, and Footer remain visible without toggle controls.
- Toggleable sections match the agreed section list.
- Logo and brand color controls exist and update preview state.
- Media assets are referenced from R2 URLs and not added to the repo.
- Preview code is split into extracted components, avoiding one long file.
