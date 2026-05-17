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
            <p className="max-w-2xl text-lg text-white/75">
              {branding.tagline}
            </p>
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
