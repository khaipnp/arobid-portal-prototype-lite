import type { SiteBranding } from "../types"
import { SectionMedia } from "./section-media"

export function BfmSection({
  branding,
  media = []
}: {
  branding?: SiteBranding
  media?: string[]
}) {
  const imageUrl = media[0]

  return (
    <section className="overflow-hidden bg-[#09213a] px-6 py-16 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-6">
          <p className="font-semibold text-[var(--site-primary)] text-xs uppercase tracking-[0.2em]">
            Verified demand meets verified supply
          </p>
          <div className="space-y-4">
            <h2 className="font-bold text-4xl">
              {branding?.bfmTitle ?? "Buyer Find & Match"}
            </h2>
            <p className="text-blue-100/80 text-lg leading-8">
              {branding?.bfmCopy ??
                "Instantly connecting standardized supplier data with verified buyer intent for absolute precision in global sourcing."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              "Semantic matching",
              "Verified profiles",
              "High-intent leads"
            ].map((item) => (
              <span
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
          <button
            className="rounded-full px-5 py-3 font-semibold text-sm text-white"
            style={{ backgroundColor: "var(--site-primary)" }}
            type="button"
          >
            {branding?.bfmCtaLabel ?? "Get Matches Now"}
          </button>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl">
          <div className="relative aspect-[600/340] overflow-hidden rounded-[1.5rem] bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.24),transparent_32%),linear-gradient(135deg,#0f172a,#1e293b)]">
            <SectionMedia
              alt="Buyer Find and Match"
              className="object-cover"
              sizes="576px"
              src={imageUrl}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
