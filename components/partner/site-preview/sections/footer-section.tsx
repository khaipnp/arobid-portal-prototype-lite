import Image from "next/image"
import type { SiteBranding } from "../types"

export function FooterSection({ branding }: { branding: SiteBranding }) {
  return (
    <footer className="border-t bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          {branding.logoUrl ? (
            <Image
              alt={`${branding.tenantName} logo`}
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
