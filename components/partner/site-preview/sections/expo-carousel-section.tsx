import type { SiteBranding } from "../types"
import { SectionMedia } from "./section-media"

export function ExpoCarouselSection({
  branding,
  media = []
}: {
  branding?: SiteBranding
  media?: string[]
}) {
  const imageUrl = media[0]

  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-10 py-16 text-white">
          <SectionMedia
            alt="Expo banner"
            className="object-cover opacity-35"
            sizes="1152px"
            src={imageUrl}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/20" />
          <div className="relative max-w-xl space-y-4">
            <p
              className="font-semibold text-sm uppercase tracking-[0.2em]"
              style={{ color: "var(--site-accent)" }}
            >
              TradeXpo
            </p>
            <h2 className="font-bold text-4xl">
              {branding?.expoTitle ?? "Discover Upcoming Trade Events"}
            </h2>
            <p className="text-white/70">
              {branding?.expoDescription ??
                "Explore trade expos, connect with global businesses, and discover new opportunities on TradeXpo."}
            </p>
            <button
              className="rounded-full px-5 py-3 font-semibold text-sm text-white"
              style={{ backgroundColor: "var(--site-primary)" }}
              type="button"
            >
              {branding?.expoCtaLabel ?? "Explore TradeXpo"}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
