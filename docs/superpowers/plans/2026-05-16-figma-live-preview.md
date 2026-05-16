# Figma Live Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Partner Portal -> Site Management live preview with an extracted Figma-derived homepage preview that supports logo upload, brand-color controls, and agreed section toggles.

**Architecture:** Keep `PartnerSiteManagementManager` as the state owner and move preview UI into `components/partner/site-preview/`. Preview components render in Figma order from a section registry. Brand colors apply only to brand-colored buttons, headings, titles, and accents.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Bun, Tailwind CSS v4, shadcn/ui, existing `useUpload` R2 flow.

---

## File Structure

- Modify: `components/partner/partner-site-management-manager.tsx`
  - Keep page-level state, relation dialog/table, reset behavior, and R2 logo upload.
  - Replace inline `PreviewCard` and old section model with extracted controls + live preview.
- Create: `components/partner/site-preview/types.ts`
  - Shared `SiteBranding`, `SiteSectionKey`, `EnabledSiteSections`, and relation types.
- Create: `components/partner/site-preview/constants.ts`
  - Default branding, section defaults, section option labels, sample cards/products/categories.
- Create: `components/partner/site-preview/site-preview-controls.tsx`
  - Branding inputs, R2 logo upload UI, brand color inputs, toggle controls.
- Create: `components/partner/site-preview/site-live-preview.tsx`
  - Preview shell, CSS variables, fixed section order, section filtering.
- Create: `components/partner/site-preview/sections/header-section.tsx`
- Create: `components/partner/site-preview/sections/banner-section.tsx`
- Create: `components/partner/site-preview/sections/community-section.tsx`
- Create: `components/partner/site-preview/sections/categories-section.tsx`
- Create: `components/partner/site-preview/sections/bfm-section.tsx`
- Create: `components/partner/site-preview/sections/suppliers-section.tsx`
- Create: `components/partner/site-preview/sections/deals-section.tsx`
- Create: `components/partner/site-preview/sections/products-section.tsx`
- Create: `components/partner/site-preview/sections/expo-carousel-section.tsx`
- Create: `components/partner/site-preview/sections/promo-section.tsx`
- Create: `components/partner/site-preview/sections/feature-cards-section.tsx`
- Create: `components/partner/site-preview/sections/partners-section.tsx`
- Create: `components/partner/site-preview/sections/cta-section.tsx`
- Create: `components/partner/site-preview/sections/footer-section.tsx`

No media files should be created in the repo. Use CSS gradients and existing remote/R2 URLs in sample data. If exact Figma media assets are downloaded later, upload them to R2 and store only URLs in constants.

---

### Task 1: Extract shared preview types and constants

**Files:**
- Create: `components/partner/site-preview/types.ts`
- Create: `components/partner/site-preview/constants.ts`

- [ ] **Step 1: Create preview types**

Create `components/partner/site-preview/types.ts`:

```ts
export type SiteBranding = {
  tenantName: string
  tagline: string
  logoUrl: string
  primaryColor: string
  accentColor: string
}

export type SiteSectionKey =
  | "community"
  | "categories"
  | "featuredSuppliers"
  | "deals"
  | "hotProducts"
  | "expoCarousel"
  | "newProducts"
  | "recommendedSuppliers"
  | "promo"
  | "featureCards"
  | "partners"
  | "cta"

export type EnabledSiteSections = Record<SiteSectionKey, boolean>

export type TenantRelationType = "partner" | "sponsor"

export type TenantRelation = {
  id: string
  name: string
  type: TenantRelationType
  tier: string
  logoUrl: string
  websiteUrl: string
  active: boolean
}

export type RelationForm = Omit<TenantRelation, "id">

export type SectionOption = {
  key: SiteSectionKey
  title: string
  description: string
}
```

- [ ] **Step 2: Create constants and sample content**

Create `components/partner/site-preview/constants.ts`:

```ts
import type {
  EnabledSiteSections,
  SectionOption,
  SiteBranding,
  TenantRelation
} from "./types"

export const initialBranding: SiteBranding = {
  tenantName: "Arobid Trade Partner",
  tagline: "Your trusted gateway to digital trade exhibitions.",
  logoUrl: "",
  primaryColor: "#f97316",
  accentColor: "#2563eb"
}

export const initialSections: EnabledSiteSections = {
  community: true,
  categories: true,
  featuredSuppliers: true,
  deals: true,
  hotProducts: true,
  expoCarousel: true,
  newProducts: true,
  recommendedSuppliers: true,
  promo: true,
  featureCards: true,
  partners: true,
  cta: true
}

export const sectionOptions: SectionOption[] = [
  {
    key: "community",
    title: "Community/value cards",
    description: "Show community metrics and service feature cards."
  },
  {
    key: "categories",
    title: "Browse by Categories",
    description: "Show category discovery shortcuts."
  },
  {
    key: "featuredSuppliers",
    title: "Featured Suppliers",
    description: "Show highlighted supplier cards."
  },
  {
    key: "deals",
    title: "Hot Deal / Brand eVoucher",
    description: "Show promotional eVoucher deal grid."
  },
  {
    key: "hotProducts",
    title: "Hot Products",
    description: "Show active product recommendations."
  },
  {
    key: "expoCarousel",
    title: "Expo banner carousel",
    description: "Show exhibition promotional carousel."
  },
  {
    key: "newProducts",
    title: "New Products",
    description: "Show latest product cards."
  },
  {
    key: "recommendedSuppliers",
    title: "Recommended Suppliers",
    description: "Show recommended supplier cards."
  },
  {
    key: "promo",
    title: "Large promo block",
    description: "Show large marketing content block."
  },
  {
    key: "featureCards",
    title: "Three feature cards",
    description: "Show three compact service cards."
  },
  {
    key: "partners",
    title: "Our Partners",
    description: "Show partner and sponsor logos."
  },
  {
    key: "cta",
    title: "CTA",
    description: "Show final growth call-to-action."
  }
]

export const initialRelations: TenantRelation[] = [
  {
    id: "partner-viettrade",
    name: "VietTrade Connect",
    type: "partner",
    tier: "Strategic Partner",
    logoUrl: "",
    websiteUrl: "https://example.com/viettrade",
    active: true
  },
  {
    id: "sponsor-logistics",
    name: "Asean Logistics Group",
    type: "sponsor",
    tier: "Gold Sponsor",
    logoUrl: "",
    websiteUrl: "https://example.com/logistics",
    active: true
  },
  {
    id: "sponsor-finance",
    name: "Trade Finance Hub",
    type: "sponsor",
    tier: "Silver Sponsor",
    logoUrl: "",
    websiteUrl: "https://example.com/finance",
    active: false
  }
]

export const emptyRelationForm = {
  name: "",
  type: "partner" as const,
  tier: "Strategic Partner",
  logoUrl: "",
  websiteUrl: "",
  active: true
}

export const communityStats = [
  ["1,200+", "Active Members"],
  ["12,000+", "Products"],
  ["5,600+", "Verified Suppliers"],
  ["120+", "Countries Connected"],
  ["300+", "Exhibitions"]
]

export const categoryLabels = [
  "Woman’s Clothing",
  "Men’s Clothing",
  "Ties & Accessories",
  "Belt & Accessories",
  "Sportwear",
  "Socks & Hosiery",
  "Hats & Caps",
  "Wedding Apparel"
]

export const productNames = [
  "Premium linen blazer",
  "Smart sourcing kit",
  "Industrial safety gloves",
  "Export-ready snack box",
  "Modular booth display"
]

export const supplierNames = [
  "Global Textile Co.",
  "Saigon Manufacturing Hub",
  "ASEAN Premium Supply"
]

export const featureNames = [
  ["AI Buyer Find & Match", "Find qualified buyers / suppliers"],
  ["RFQ Center", "Turn RFQs into Deals"],
  ["Expo Booking", "Connect with leads"],
  ["eVoucher Deals", "Exclusive partner offers"],
  ["Business Support", "Always ready help"],
  ["For Members", "Benefits & Service"]
]
```

- [ ] **Step 3: Run typecheck to confirm new files compile in isolation**

Run: `bun typecheck`

Expected: It may fail because files are not imported yet, but there should be no syntax error in the two new files.

---

### Task 2: Build extracted controls component

**Files:**
- Create: `components/partner/site-preview/site-preview-controls.tsx`

- [ ] **Step 1: Create controls component**

Create `components/partner/site-preview/site-preview-controls.tsx`:

```tsx
import { ImageIcon, LayoutTemplateIcon, Loader2Icon } from "lucide-react"
import Image from "next/image"
import { type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { sectionOptions } from "./constants"
import type { EnabledSiteSections, SiteBranding, SiteSectionKey } from "./types"

export function SitePreviewControls({
  branding,
  isUploadingLogo,
  sections,
  onBrandingChange,
  onRemoveLogo,
  onSectionToggle,
  onUploadLogo
}: {
  branding: SiteBranding
  isUploadingLogo: boolean
  sections: EnabledSiteSections
  onBrandingChange: <Key extends keyof SiteBranding>(
    key: Key,
    value: SiteBranding[Key]
  ) => void
  onRemoveLogo: () => void
  onSectionToggle: (key: SiteSectionKey) => void
  onUploadLogo: (file: File) => void
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="size-5" />
            Branding
          </CardTitle>
          <CardDescription>
            Configure logo and brand colors for branded buttons, headings, and
            accents.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <Field label="Tenant name">
            <Input
              value={branding.tenantName}
              onChange={(event) =>
                onBrandingChange("tenantName", event.target.value)
              }
            />
          </Field>
          <LogoUploadField
            branding={branding}
            isUploading={isUploadingLogo}
            onRemove={onRemoveLogo}
            onUpload={onUploadLogo}
          />
          <Field className="lg:col-span-2" label="Tagline">
            <Textarea
              rows={3}
              value={branding.tagline}
              onChange={(event) =>
                onBrandingChange("tagline", event.target.value)
              }
            />
          </Field>
          <ColorField
            label="Primary brand color"
            value={branding.primaryColor}
            onChange={(value) => onBrandingChange("primaryColor", value)}
          />
          <ColorField
            label="Accent brand color"
            value={branding.accentColor}
            onChange={(value) => onBrandingChange("accentColor", value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplateIcon className="size-5" />
            Homepage sections
          </CardTitle>
          <CardDescription>
            Header, banner, Buyer Find & Match, and footer always stay visible.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {sectionOptions.map((section) => (
            <div
              className="flex items-start justify-between gap-4 rounded-lg border p-3"
              key={section.key}
            >
              <div className="space-y-1">
                <Label>{section.title}</Label>
                <p className="text-muted-foreground text-sm">
                  {section.description}
                </p>
              </div>
              <Switch
                checked={sections[section.key]}
                onCheckedChange={() => onSectionToggle(section.key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function LogoUploadField({
  branding,
  isUploading,
  onRemove,
  onUpload
}: {
  branding: SiteBranding
  isUploading: boolean
  onRemove: () => void
  onUpload: (file: File) => void
}) {
  return (
    <div className="space-y-2">
      <Label>Logo upload</Label>
      <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
          {branding.logoUrl ? (
            <Image
              alt=""
              className="size-16 object-cover"
              height={64}
              src={branding.logoUrl}
              width={64}
            />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium text-sm">Tenant logo</p>
          <p className="truncate text-muted-foreground text-xs">
            {branding.logoUrl || "Upload PNG, JPG, SVG, or WebP to R2."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild disabled={isUploading} variant="outline">
            <Label className="cursor-pointer">
              {isUploading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <ImageIcon className="size-4" />
              )}
              {isUploading ? "Uploading" : "Upload"}
              <Input
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) onUpload(file)
                  event.currentTarget.value = ""
                }}
              />
            </Label>
          </Button>
          {branding.logoUrl ? (
            <Button disabled={isUploading} variant="ghost" onClick={onRemove}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Field({
  children,
  className,
  label
}: {
  children: ReactNode
  className?: string
  label: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <Input
          className="h-10 w-14 p-1"
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </Field>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `bun typecheck`

Expected: New component should typecheck or fail only because it is not imported yet. Fix any reported TypeScript errors in this file before moving on.

---

### Task 3: Build reusable section primitives and core always-visible sections

**Files:**
- Create: `components/partner/site-preview/sections/header-section.tsx`
- Create: `components/partner/site-preview/sections/banner-section.tsx`
- Create: `components/partner/site-preview/sections/bfm-section.tsx`
- Create: `components/partner/site-preview/sections/footer-section.tsx`

- [ ] **Step 1: Create header section**

Create `components/partner/site-preview/sections/header-section.tsx`:

```tsx
import Image from "next/image"
import type { SiteBranding } from "../types"

export function HeaderSection({ branding }: { branding: SiteBranding }) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
        <BrandLogo branding={branding} />
        <div className="hidden h-10 flex-1 items-center rounded-full border bg-slate-50 px-4 text-slate-400 text-sm md:flex">
          Search products, suppliers, and exhibitions
        </div>
        <nav className="ml-auto hidden items-center gap-6 text-slate-600 text-sm lg:flex">
          <span>Find Suppliers</span>
          <span>RFQ Center</span>
          <span>TradeXpo</span>
          <span>Community</span>
        </nav>
        <button
          className="rounded-full px-4 py-2 font-semibold text-sm text-white"
          style={{ backgroundColor: "var(--site-primary)" }}
          type="button"
        >
          Join now
        </button>
      </div>
    </header>
  )
}

function BrandLogo({ branding }: { branding: SiteBranding }) {
  if (branding.logoUrl) {
    return (
      <Image
        alt=""
        className="h-10 w-32 object-contain"
        height={40}
        src={branding.logoUrl}
        width={128}
      />
    )
  }

  return (
    <div className="flex h-10 w-32 items-center justify-center rounded-xl border bg-white font-semibold text-slate-900 text-sm">
      {branding.tenantName}
    </div>
  )
}
```

- [ ] **Step 2: Create banner section**

Create `components/partner/site-preview/sections/banner-section.tsx`:

```tsx
import type { SiteBranding } from "../types"

export function BannerSection({ branding }: { branding: SiteBranding }) {
  return (
    <section className="relative overflow-hidden bg-slate-950 px-6 py-20 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.28),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(37,99,235,0.26),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="space-y-6">
          <div
            className="inline-flex rounded-full px-4 py-2 font-semibold text-sm"
            style={{ backgroundColor: "var(--site-primary)" }}
          >
            Digital Trade & Investment Infrastructure
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl font-bold text-5xl leading-tight">
              Build stronger global trade connections
            </h1>
            <p className="max-w-2xl text-lg text-white/75">{branding.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full px-5 py-3 font-semibold text-sm text-white"
              style={{ backgroundColor: "var(--site-primary)" }}
              type="button"
            >
              Explore marketplace
            </button>
            <button
              className="rounded-full border border-white/25 px-5 py-3 font-semibold text-sm text-white"
              type="button"
            >
              List your company
            </button>
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
          <div className="aspect-[4/3] rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.2)),radial-gradient(circle_at_70%_30%,rgba(249,115,22,0.55),transparent_35%)]" />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create Buyer Find & Match section**

Create `components/partner/site-preview/sections/bfm-section.tsx`:

```tsx
export function BfmSection() {
  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <div className="space-y-3">
            <h2
              className="font-bold text-4xl text-slate-950"
              style={{ color: "var(--site-primary)" }}
            >
              Buyer Find & Match
            </h2>
            <p className="text-slate-600 text-lg leading-8">
              Instantly connecting standardized supplier data with verified buyer
              intent for absolute precision in global sourcing.
            </p>
          </div>
          <button
            className="rounded-full px-5 py-3 font-semibold text-sm text-white"
            style={{ backgroundColor: "var(--site-primary)" }}
            type="button"
          >
            Find matches now
          </button>
        </div>
        <div className="rounded-[2rem] bg-slate-100 p-4">
          <div className="aspect-[16/9] rounded-[1.5rem] bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.24),transparent_32%),linear-gradient(135deg,#f8fafc,#e2e8f0)]" />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create footer section**

Create `components/partner/site-preview/sections/footer-section.tsx`:

```tsx
import Image from "next/image"
import type { SiteBranding } from "../types"

export function FooterSection({ branding }: { branding: SiteBranding }) {
  return (
    <footer className="border-t bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          {branding.logoUrl ? (
            <Image
              alt=""
              className="h-12 w-40 object-contain"
              height={48}
              src={branding.logoUrl}
              width={160}
            />
          ) : (
            <div className="font-semibold text-xl">{branding.tenantName}</div>
          )}
          <p className="text-sm text-white/65">
            The representative organization for businesses operating in
            manufacturing, trade, and services.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-4">
          {["Buy", "Sell", "Support", "Company"].map((title) => (
            <div className="space-y-3" key={title}>
              <div className="font-semibold">{title}</div>
              <div className="space-y-2 text-sm text-white/60">
                <div>Find Suppliers</div>
                <div>RFQ Center</div>
                <div>Membership</div>
                <div>Contact Us</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 5: Run typecheck**

Run: `bun typecheck`

Expected: These section files should have no TypeScript errors.

---

### Task 4: Build toggleable Figma section components

**Files:**
- Create: `components/partner/site-preview/sections/community-section.tsx`
- Create: `components/partner/site-preview/sections/categories-section.tsx`
- Create: `components/partner/site-preview/sections/suppliers-section.tsx`
- Create: `components/partner/site-preview/sections/deals-section.tsx`
- Create: `components/partner/site-preview/sections/products-section.tsx`
- Create: `components/partner/site-preview/sections/expo-carousel-section.tsx`
- Create: `components/partner/site-preview/sections/promo-section.tsx`
- Create: `components/partner/site-preview/sections/feature-cards-section.tsx`
- Create: `components/partner/site-preview/sections/partners-section.tsx`
- Create: `components/partner/site-preview/sections/cta-section.tsx`

- [ ] **Step 1: Create community section**

Create `components/partner/site-preview/sections/community-section.tsx`:

```tsx
import { ArrowUpRightIcon } from "lucide-react"
import { communityStats, featureNames } from "../constants"

export function CommunitySection() {
  return (
    <section className="bg-slate-50 px-6 py-14">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              className="font-bold text-4xl"
              style={{ color: "var(--site-primary)" }}
            >
              The Power of TBSG Community
            </h2>
          </div>
          <button
            className="rounded-full px-5 py-2 font-semibold text-sm text-white"
            style={{ backgroundColor: "var(--site-primary)" }}
            type="button"
          >
            Explore more
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {communityStats.map(([value, label]) => (
            <div className="border-l pl-4" key={label}>
              <div className="font-bold text-3xl text-slate-950">{value}</div>
              <div className="text-slate-500 text-sm">{label}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {featureNames.map(([title, text], index) => (
            <div
              className="group flex min-h-32 items-end justify-between rounded-3xl bg-white p-6 shadow-sm"
              key={title}
            >
              <div>
                <h3 className="font-semibold text-xl text-slate-950">{title}</h3>
                <p className="text-slate-500 text-sm">{text}</p>
              </div>
              <div
                className="flex size-10 items-center justify-center rounded-full text-white"
                style={{
                  backgroundColor:
                    index % 2 === 0
                      ? "var(--site-primary)"
                      : "var(--site-accent)"
                }}
              >
                <ArrowUpRightIcon className="size-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create categories section**

Create `components/partner/site-preview/sections/categories-section.tsx`:

```tsx
import { categoryLabels } from "../constants"

export function CategoriesSection() {
  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <h2
          className="text-center font-bold text-3xl"
          style={{ color: "var(--site-primary)" }}
        >
          Browse by Categories
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          {categoryLabels.map((category) => (
            <div className="space-y-3 text-center" key={category}>
              <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-slate-100">
                <div
                  className="size-10 rounded-2xl"
                  style={{ backgroundColor: "var(--site-accent)" }}
                />
              </div>
              <div className="font-medium text-slate-700 text-sm">{category}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create suppliers section**

Create `components/partner/site-preview/sections/suppliers-section.tsx`:

```tsx
import { supplierNames } from "../constants"

export function SuppliersSection({ title }: { title: string }) {
  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <h2
            className="font-bold text-3xl"
            style={{ color: "var(--site-primary)" }}
          >
            {title}
          </h2>
          <button className="font-semibold text-sm" style={{ color: "var(--site-primary)" }} type="button">
            View all
          </button>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {supplierNames.map((supplier, index) => (
            <div className="rounded-3xl border bg-white p-5 shadow-sm" key={supplier}>
              <div className="mb-5 aspect-[16/9] rounded-2xl bg-slate-100" />
              <div className="space-y-3">
                <h3 className="font-semibold text-xl text-slate-950">{supplier}</h3>
                <p className="text-slate-500 text-sm">
                  Verified supplier with export-ready products and active trade
                  programs.
                </p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 text-xs">
                    Tier {index + 1}
                  </span>
                  <button
                    className="rounded-full px-4 py-2 font-semibold text-sm text-white"
                    style={{ backgroundColor: "var(--site-primary)" }}
                    type="button"
                  >
                    Contact
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create deals section**

Create `components/partner/site-preview/sections/deals-section.tsx`:

```tsx
export function DealsSection() {
  return (
    <section className="bg-slate-50 px-6 py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-3 py-1 font-bold text-sm text-white"
            style={{ backgroundColor: "var(--site-primary)" }}
          >
            HOT DEAL
          </span>
          <h2 className="font-bold text-2xl text-slate-950">Brand eVoucher</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
          <DealCard large title="Top Ranking" />
          <div className="grid gap-5 sm:grid-cols-2">
            {["Buyer services", "Supplier boost", "Expo package", "Member deals"].map(
              (deal) => (
                <DealCard key={deal} title={deal} />
              )
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function DealCard({ large, title }: { large?: boolean; title: string }) {
  return (
    <div className="flex min-h-48 flex-col justify-end rounded-3xl bg-slate-900 p-6 text-white">
      <div className="space-y-3">
        <h3 className="font-bold text-2xl">{title}</h3>
        <button
          className="rounded-full px-4 py-2 font-semibold text-sm text-white"
          style={{ backgroundColor: "var(--site-primary)" }}
          type="button"
        >
          {large ? "Claim top deal" : "Claim now"}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create products section**

Create `components/partner/site-preview/sections/products-section.tsx`:

```tsx
import { productNames } from "../constants"

export function ProductsSection({ title }: { title: string }) {
  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <h2
            className="font-bold text-3xl"
            style={{ color: "var(--site-primary)" }}
          >
            {title}
          </h2>
          <button className="font-semibold text-sm" style={{ color: "var(--site-primary)" }} type="button">
            View all
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {productNames.map((product, index) => (
            <div className="overflow-hidden rounded-3xl border bg-white shadow-sm" key={product}>
              <div className="aspect-square bg-slate-100" />
              <div className="space-y-3 p-4">
                <h3 className="line-clamp-2 font-semibold text-slate-950 text-sm">
                  {product}
                </h3>
                <p className="font-bold" style={{ color: "var(--site-primary)" }}>
                  ${(index + 2) * 12}.00
                </p>
                <button
                  className="w-full rounded-full px-3 py-2 font-semibold text-sm text-white"
                  style={{ backgroundColor: "var(--site-primary)" }}
                  type="button"
                >
                  View product
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Create expo carousel section**

Create `components/partner/site-preview/sections/expo-carousel-section.tsx`:

```tsx
export function ExpoCarouselSection() {
  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-10 py-16 text-white">
          <div className="max-w-xl space-y-4">
            <p
              className="font-semibold text-sm uppercase tracking-[0.2em]"
              style={{ color: "var(--site-accent)" }}
            >
              TradeXpo Live
            </p>
            <h2 className="font-bold text-4xl">Discover upcoming exhibitions</h2>
            <p className="text-white/70">
              Promote curated expo programs with one strong carousel banner.
            </p>
            <button
              className="rounded-full px-5 py-3 font-semibold text-sm text-white"
              style={{ backgroundColor: "var(--site-primary)" }}
              type="button"
            >
              Browse expos
            </button>
          </div>
          <div className="absolute right-8 bottom-8 flex gap-2">
            <span className="h-2 w-8 rounded-full bg-white" />
            <span className="size-2 rounded-full bg-white/40" />
            <span className="size-2 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Create promo section**

Create `components/partner/site-preview/sections/promo-section.tsx`:

```tsx
export function PromoSection() {
  return (
    <section className="bg-slate-50 px-6 py-14">
      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
        {["Digital sourcing", "Verified buyers", "Trade enablement"].map((title) => (
          <div className="rounded-3xl bg-white p-8 shadow-sm" key={title}>
            <div
              className="mb-6 size-12 rounded-2xl"
              style={{ backgroundColor: "var(--site-accent)" }}
            />
            <h3 className="font-bold text-xl text-slate-950">{title}</h3>
            <p className="mt-2 text-slate-500 text-sm">
              Support business growth through trusted marketplace operations.
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Create feature cards section**

Create `components/partner/site-preview/sections/feature-cards-section.tsx`:

```tsx
export function FeatureCardsSection() {
  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {["Trusted data", "Smart matching", "Member benefits"].map((title) => (
          <div className="rounded-3xl border p-8" key={title}>
            <h3
              className="font-bold text-2xl"
              style={{ color: "var(--site-primary)" }}
            >
              {title}
            </h3>
            <p className="mt-3 text-slate-500">
              Simple tools for partner-led digital trade experiences.
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 9: Create partners section**

Create `components/partner/site-preview/sections/partners-section.tsx`:

```tsx
import Image from "next/image"
import type { TenantRelation } from "../types"

export function PartnersSection({
  relations
}: {
  relations: TenantRelation[]
}) {
  const activeRelations = relations.filter((relation) => relation.active)

  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <h2
          className="font-bold text-3xl"
          style={{ color: "var(--site-primary)" }}
        >
          Our Partners
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
          {activeRelations.map((relation) => (
            <div
              className="flex aspect-square items-center justify-center rounded-3xl border bg-white p-3"
              key={relation.id}
            >
              {relation.logoUrl ? (
                <Image
                  alt=""
                  className="max-h-16 max-w-20 object-contain"
                  height={64}
                  src={relation.logoUrl}
                  width={80}
                />
              ) : (
                <span className="text-center font-semibold text-slate-700 text-xs">
                  {relation.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 10: Create CTA section**

Create `components/partner/site-preview/sections/cta-section.tsx`:

```tsx
import Image from "next/image"
import type { SiteBranding } from "../types"

export function CtaSection({ branding }: { branding: SiteBranding }) {
  return (
    <section className="bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl space-y-6 text-center">
        {branding.logoUrl ? (
          <Image
            alt=""
            className="mx-auto h-12 w-40 object-contain"
            height={48}
            src={branding.logoUrl}
            width={160}
          />
        ) : null}
        <h2 className="font-bold text-4xl">Ready to grow your business globally?</h2>
        <p className="text-white/70">
          Connect with thousands of businesses in the TBSG community to scale
          your reach and shape your future.
        </p>
        <button
          className="rounded-full px-5 py-3 font-semibold text-sm text-white"
          style={{ backgroundColor: "var(--site-primary)" }}
          type="button"
        >
          Get started
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 11: Run typecheck**

Run: `bun typecheck`

Expected: Section files have no TypeScript errors. Fix wrapping or import errors before moving on.

---

### Task 5: Assemble live preview shell

**Files:**
- Create: `components/partner/site-preview/site-live-preview.tsx`

- [ ] **Step 1: Create live preview component**

Create `components/partner/site-preview/site-live-preview.tsx`:

```tsx
import { BannerSection } from "./sections/banner-section"
import { BfmSection } from "./sections/bfm-section"
import { CategoriesSection } from "./sections/categories-section"
import { CommunitySection } from "./sections/community-section"
import { CtaSection } from "./sections/cta-section"
import { DealsSection } from "./sections/deals-section"
import { ExpoCarouselSection } from "./sections/expo-carousel-section"
import { FeatureCardsSection } from "./sections/feature-cards-section"
import { FooterSection } from "./sections/footer-section"
import { HeaderSection } from "./sections/header-section"
import { PartnersSection } from "./sections/partners-section"
import { ProductsSection } from "./sections/products-section"
import { PromoSection } from "./sections/promo-section"
import { SuppliersSection } from "./sections/suppliers-section"
import type { EnabledSiteSections, SiteBranding, TenantRelation } from "./types"

export function SiteLivePreview({
  branding,
  relations,
  sections
}: {
  branding: SiteBranding
  relations: TenantRelation[]
  sections: EnabledSiteSections
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl border bg-white shadow-sm"
      style={
        {
          "--site-primary": branding.primaryColor,
          "--site-accent": branding.accentColor
        } as React.CSSProperties
      }
    >
      <div className="max-h-[760px] overflow-y-auto bg-white">
        <HeaderSection branding={branding} />
        <BannerSection branding={branding} />
        {sections.community ? <CommunitySection /> : null}
        {sections.categories ? <CategoriesSection /> : null}
        <BfmSection />
        {sections.featuredSuppliers ? (
          <SuppliersSection title="Featured Suppliers" />
        ) : null}
        {sections.deals ? <DealsSection /> : null}
        {sections.hotProducts ? <ProductsSection title="Hot Products" /> : null}
        {sections.expoCarousel ? <ExpoCarouselSection /> : null}
        {sections.newProducts ? <ProductsSection title="New Products" /> : null}
        {sections.recommendedSuppliers ? (
          <SuppliersSection title="Recommended Suppliers" />
        ) : null}
        {sections.promo ? <PromoSection /> : null}
        {sections.featureCards ? <FeatureCardsSection /> : null}
        {sections.partners ? <PartnersSection relations={relations} /> : null}
        {sections.cta ? <CtaSection branding={branding} /> : null}
        <FooterSection branding={branding} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Fix React.CSSProperties import if needed**

If `bun typecheck` reports `Cannot find namespace React`, add this import at top:

```ts
import type { CSSProperties } from "react"
```

Then replace `React.CSSProperties` with `CSSProperties`:

```tsx
style={
  {
    "--site-primary": branding.primaryColor,
    "--site-accent": branding.accentColor
  } as CSSProperties
}
```

- [ ] **Step 3: Run typecheck**

Run: `bun typecheck`

Expected: `site-live-preview.tsx` has no missing import or CSSProperties errors.

---

### Task 6: Wire extracted preview into Site Management manager

**Files:**
- Modify: `components/partner/partner-site-management-manager.tsx`

- [ ] **Step 1: Update imports**

In `components/partner/partner-site-management-manager.tsx`, remove unused imports tied to old inline preview and controls:

```ts
ImageIcon,
LayoutTemplateIcon,
Loader2Icon,
```

Remove `Image` import if only old inline preview/control code used it:

```ts
import Image from "next/image"
```

Add imports:

```ts
import {
  emptyRelationForm,
  initialBranding,
  initialRelations,
  initialSections
} from "@/components/partner/site-preview/constants"
import { SiteLivePreview } from "@/components/partner/site-preview/site-live-preview"
import { SitePreviewControls } from "@/components/partner/site-preview/site-preview-controls"
import type {
  EnabledSiteSections,
  RelationForm,
  SiteBranding,
  SiteSectionKey,
  TenantRelation,
  TenantRelationType
} from "@/components/partner/site-preview/types"
```

- [ ] **Step 2: Delete old local type/constants blocks**

Remove these old definitions from `partner-site-management-manager.tsx`:

```ts
type SiteBranding = { ... }
type HomepageSections = { ... }
type TenantRelationType = "partner" | "sponsor"
type TenantRelation = { ... }
type RelationForm = Omit<TenantRelation, "id">
const initialBranding = { ... }
const initialSections = { ... }
const initialRelations = [ ... ]
const sectionOptions = [ ... ]
const emptyRelationForm = { ... }
```

- [ ] **Step 3: Update section state type usage**

Change `toggleSection` signature:

```ts
function toggleSection(key: SiteSectionKey) {
  setSections((current) => ({ ...current, [key]: !current[key] }))
}
```

`sections` will infer `EnabledSiteSections` from `initialSections`.

- [ ] **Step 4: Replace controls rendering**

Replace this block:

```tsx
<BrandingCard
  branding={branding}
  isUploadingLogo={isUploading}
  onChange={updateBranding}
  onRemoveLogo={removeLogo}
  onUploadLogo={uploadLogo}
/>
<SectionsCard sections={sections} onToggle={toggleSection} />
<RelationsCard
  relations={relations}
  onCreate={openCreateDialog}
  onEdit={openEditDialog}
  onDelete={setDeleteTarget}
/>
```

with:

```tsx
<SitePreviewControls
  branding={branding}
  isUploadingLogo={isUploading}
  sections={sections}
  onBrandingChange={updateBranding}
  onRemoveLogo={removeLogo}
  onSectionToggle={toggleSection}
  onUploadLogo={uploadLogo}
/>
<RelationsCard
  relations={relations}
  onCreate={openCreateDialog}
  onEdit={openEditDialog}
  onDelete={setDeleteTarget}
/>
```

- [ ] **Step 5: Replace preview rendering**

Replace:

```tsx
<PreviewCard
  branding={branding}
  sections={sections}
  activePartners={activePartners}
  activeSponsors={activeSponsors}
  activeSectionCount={activeSectionCount}
/>
```

with:

```tsx
<Card className="sticky top-4 h-fit overflow-hidden">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <EyeIcon className="size-5" />
      Live preview
    </CardTitle>
    <CardDescription>
      Figma-derived homepage preview using local configuration.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <SiteLivePreview
      branding={branding}
      relations={relations}
      sections={sections}
    />
  </CardContent>
</Card>
```

- [ ] **Step 6: Remove old inline preview/control helper components**

Delete these functions from `partner-site-management-manager.tsx`:

```ts
BrandingCard
LogoUploadField
SectionsCard
PreviewCard
ColorField
PreviewLogo
PreviewMetric
PreviewBlock
RelationPreview
```

Keep these functions:

```ts
RelationsCard
RelationDialog
Field
LogoThumb
```

`Field` remains used by `RelationDialog`.

- [ ] **Step 7: Remove unused derived values**

Remove these `useMemo` blocks and count if no longer used:

```ts
const activePartners = useMemo(...)
const activeSponsors = useMemo(...)
const activeSectionCount = Object.values(sections).filter(Boolean).length
```

If `useMemo` is no longer used elsewhere, remove it from React import:

```ts
import { type ReactNode, useState } from "react"
```

- [ ] **Step 8: Run typecheck**

Run: `bun typecheck`

Expected: No TypeScript errors in manager or preview files. Fix unused imports and type mismatches.

---

### Task 7: Run formatter/lint and fix style issues

**Files:**
- Modify files reported by formatter/lint only.

- [ ] **Step 1: Run Biome check with fixes**

Run: `bun check`

Expected: Biome formats files and reports no remaining errors. If it changes files, inspect relevant diff before proceeding.

- [ ] **Step 2: Run typecheck again**

Run: `bun typecheck`

Expected: PASS.

---

### Task 8: Browser-test Site Management preview

**Files:**
- No planned code changes unless browser testing exposes a bug.

- [ ] **Step 1: Start dev server**

Run: `bun dev`

Expected: Next.js dev server starts on configured port, likely `1995`.

- [ ] **Step 2: Open Partner Site Management**

Use browser to navigate to:

```text
http://localhost:1995/partner/site-management
```

Expected: Site Management page renders with controls on left and Figma-derived live preview on right.

- [ ] **Step 3: Verify always-visible sections**

Confirm these sections render and have no toggles:

- Header
- Banner
- Buyer Find & Match
- Footer

Expected: They remain visible after all toggleable sections are turned off.

- [ ] **Step 4: Verify section toggles**

Turn off each toggleable section one at a time:

- Community/value cards
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

Expected: Matching section disappears without blank gap. Turning it back on restores it in original Figma order.

- [ ] **Step 5: Verify brand color scope**

Change primary brand color to `#16a34a` and accent color to `#9333ea`.

Expected: Branded buttons, headings, titles, badges, and accents update. Neutral backgrounds, body text, cards, and overall page surface do not recolor.

- [ ] **Step 6: Verify logo behavior**

If R2 env vars are configured, upload a small logo file through the control.

Expected: Upload completes, logo appears in header/footer/CTA preview, and no local media file is created in the repo.

If R2 env vars are not configured, attempt upload.

Expected: Upload does not crash page. Existing logo state remains unchanged.

---

### Task 9: Final verification and review

**Files:**
- No planned code changes unless verification exposes a bug.

- [ ] **Step 1: Check git diff**

Run: `git diff -- components/partner/partner-site-management-manager.tsx components/partner/site-preview docs/superpowers/specs/2026-05-16-figma-live-preview-design.md docs/superpowers/plans/2026-05-16-figma-live-preview.md`

Expected: Diff contains extracted preview components, manager wiring, approved spec updates, and this plan. No media files.

- [ ] **Step 2: Confirm no repo media was added**

Run: `git status --short`

Expected: No new image/video/font media files under `public/`, `app/`, or `components/`.

- [ ] **Step 3: Request code review**

Use `superpowers:requesting-code-review` before claiming completion.

Expected: Reviewer checks for correctness, overlong files, brand-color scope, and R2/media handling.

- [ ] **Step 4: Fix review findings**

Apply any valid review fixes, then rerun:

```bash
bun check
bun typecheck
```

Expected: Both pass.

- [ ] **Step 5: Report completion**

Report changed files, verification commands, browser test result, and any R2 upload limitation if env vars were missing.
