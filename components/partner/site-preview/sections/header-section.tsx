import Image from "next/image"
import type { SiteBranding } from "../types"

export function HeaderSection({ branding }: { branding: SiteBranding }) {
  const navItems =
    branding.navItems && branding.navItems.length > 0
      ? branding.navItems
      : ["Find Suppliers", "RFQ Center", "TradeXpo", "Community"]

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
        <BrandLogo branding={branding} />
        <div className="hidden h-10 flex-1 items-center rounded-full border bg-slate-50 px-4 text-slate-400 text-sm md:flex">
          {branding.searchPlaceholder ??
            "Search products, suppliers, and exhibitions"}
        </div>
        <nav className="ml-auto hidden items-center gap-6 text-slate-600 text-sm lg:flex">
          {navItems.slice(0, 5).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </nav>
        <button
          className="rounded-full px-4 py-2 font-semibold text-sm text-white"
          style={{ backgroundColor: "var(--site-primary)" }}
          type="button"
        >
          {branding.headerCtaLabel ?? "Join now"}
        </button>
      </div>
    </header>
  )
}

function BrandLogo({ branding }: { branding: SiteBranding }) {
  if (branding.logoUrl) {
    return (
      <Image
        alt={`${branding.tenantName} logo`}
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
