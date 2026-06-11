import type { SiteBranding } from "../types"
import { SectionMedia } from "./section-media"

export function PromoSection({
  branding,
  media = []
}: {
  branding?: SiteBranding
  media?: string[]
}) {
  const imageUrl = media[0]
  const newsUrls = branding?.whyJoinNewsUrls ?? []

  return (
    <section className="bg-slate-50 px-6 py-14">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-6">
          <h2 className="font-bold text-4xl text-slate-950">
            {branding?.whyJoinTitle ?? "Why join TBSG?"}
          </h2>
          <p className="whitespace-pre-line text-lg text-slate-600 leading-8">
            {branding?.whyJoinDescription ??
              "Connecting business partners.\nSupporting business transformation.\nExpanding global trade channels."}
          </p>
          <button
            className="rounded-full px-5 py-3 font-semibold text-sm text-white"
            style={{ backgroundColor: "var(--site-primary)" }}
            type="button"
          >
            {branding?.whyJoinCtaLabel ?? "Join TBSG now"}
          </button>
        </div>
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-900">
            <div className="relative aspect-[16/9] overflow-hidden">
              <SectionMedia
                alt="Why join media"
                className="object-cover"
                sizes="640px"
                src={imageUrl}
              />
            </div>
          </div>
          {newsUrls.length > 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-lg text-slate-950">
                News links
              </h3>
              <div className="mt-4 space-y-3">
                {newsUrls.map((url) => (
                  <a
                    className="block break-all rounded-2xl bg-slate-50 px-4 py-3 text-slate-600 text-sm hover:text-slate-950"
                    href={url}
                    key={url}
                  >
                    {url}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
