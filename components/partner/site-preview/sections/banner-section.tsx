import type { SiteBranding } from "../types"
import { SectionMedia } from "./section-media"

export function BannerSection({
  branding,
  media = []
}: {
  branding: SiteBranding
  media?: string[]
}) {
  const bannerImage = media[0] || branding.bannerUrl
  const heroTitle = branding.heroTitle ?? branding.tenantName
  const heroCopy = branding.heroCopy ?? branding.tagline

  return (
    <section className="relative overflow-hidden bg-slate-950 px-6 py-20 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.28),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(37,99,235,0.26),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="space-y-6">
          <div
            className="inline-flex rounded-full px-4 py-2 font-semibold text-sm"
            style={{ backgroundColor: "var(--site-primary)" }}
          >
            {branding.heroEyebrow ??
              "Digital Trade & Investment Infrastructure"}
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl font-bold text-5xl leading-tight">
              {heroTitle}
            </h1>
            <p className="max-w-2xl text-lg text-white/75">{heroCopy}</p>
          </div>
          <div className="max-w-xl rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm text-white/60">
            {branding.searchPlaceholder ??
              "Search products, suppliers, and exhibitions"}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full px-5 py-3 font-semibold text-sm text-white"
              style={{ backgroundColor: "var(--site-primary)" }}
              type="button"
            >
              {branding.primaryCtaLabel ?? "Explore marketplace"}
            </button>
            <button
              className="rounded-full border border-white/25 px-5 py-3 font-semibold text-sm text-white"
              type="button"
            >
              {branding.secondaryCtaLabel ?? "List your company"}
            </button>
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.2)),radial-gradient(circle_at_70%_30%,rgba(249,115,22,0.55),transparent_35%)]">
            <SectionMedia
              alt={`${branding.tenantName} banner`}
              className="object-cover"
              sizes="420px"
              src={bannerImage}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
