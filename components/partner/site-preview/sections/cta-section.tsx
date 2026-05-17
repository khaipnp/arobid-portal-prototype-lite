import Image from "next/image"
import type { SiteBranding } from "../types"

export function CtaSection({ branding }: { branding: SiteBranding }) {
  return (
    <section className="bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl space-y-6 text-center">
        {branding.logoUrl ? (
          <Image
            alt={`${branding.tenantName} logo`}
            className="mx-auto h-12 w-40 object-contain"
            height={48}
            src={branding.logoUrl}
            width={160}
          />
        ) : null}
        <h2 className="font-bold text-4xl">
          Ready to grow your business globally?
        </h2>
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
