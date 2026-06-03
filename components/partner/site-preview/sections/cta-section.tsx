import Image from "next/image"
import type { CtaOption, SiteBranding } from "../types"

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

  return (
    <section className="relative overflow-hidden bg-slate-950 px-6 py-16 text-white">
      {imageUrl ? (
        <Image
          alt=""
          className="object-cover opacity-25"
          fill
          sizes="1152px"
          src={imageUrl}
        />
      ) : null}
      <div className="absolute inset-0 bg-slate-950/60" />
      <div className="relative mx-auto max-w-4xl space-y-6 text-center">
        {branding.logoUrl ? (
          <Image
            alt={`${branding.tenantName} logo`}
            className="mx-auto h-12 w-40 object-contain"
            height={48}
            src={branding.logoUrl}
            width={160}
          />
        ) : null}
        <h2 className="font-bold text-4xl">{branding.tenantName}</h2>
        <p className="text-white/70">{branding.serviceBundleText}</p>
        <button
          className="rounded-full px-5 py-3 font-semibold text-sm text-white"
          style={{ backgroundColor: "var(--site-primary)" }}
          type="button"
        >
          {ctaLabels[branding.ctaOption]}
        </button>
      </div>
    </section>
  )
}
