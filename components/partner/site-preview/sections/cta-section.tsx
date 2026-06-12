import type { CtaOption, SiteBranding } from "../types"
import { SectionMedia } from "./section-media"

const ctaLabels: Record<CtaOption, string> = {
  contact_tenant: "Contact Tenant",
  view_member_companies: "View Member Companies",
  view_assigned_expos: "View Assigned Expos",
  contact_arobid: "Contact Arobid"
}

export function CtaSection({
  branding,
  media = []
}: {
  branding: SiteBranding
  media?: string[]
}) {
  const imageUrl = media[0]
  const ctaLabel = branding.finalCtaLabel ?? ctaLabels[branding.ctaOption]

  return (
    <section className="relative overflow-hidden bg-slate-950 px-6 py-16 text-white">
      <SectionMedia
        alt="Final CTA background"
        className="object-cover opacity-25"
        sizes="1152px"
        src={imageUrl}
      />
      <div className="absolute inset-0 bg-slate-950/60" />
      <div className="relative mx-auto max-w-4xl space-y-6 text-center">
        <h2 className="font-bold text-4xl">
          {branding.finalCtaTitle ?? "Ready to grow your business globally?"}
        </h2>
        <p className="text-white/70">
          {branding.finalCtaDescription ??
            "Connect with thousands of businesses in the TBSG community to scale your reach and shape your future."}
        </p>
        <button
          className="rounded-full px-5 py-3 font-semibold text-sm text-white"
          style={{ backgroundColor: "var(--site-primary)" }}
          type="button"
        >
          {ctaLabel}
        </button>
      </div>
    </section>
  )
}
