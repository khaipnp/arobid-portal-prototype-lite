import { PlayCircle } from "lucide-react"
import Image from "next/image"
import { tenantAssets } from "@/lib/tenant/landing-data"
import { SectionShell } from "./shared"

const countdown = [
  ["97", "Days"],
  ["23", "Hours"],
  ["48", "Minutes"],
  ["19", "Seconds"]
] as const

export function ExpoBanner() {
  return (
    <SectionShell className="bg-[#f9fafb] py-5">
      <div className="relative overflow-hidden rounded-[20px] px-5 py-10 text-white lg:px-8">
        <Image
          src={tenantAssets.expoBannerBg}
          alt="Vietnam Food & Beverage Expo"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
          <div>
            <span className="inline-flex rounded-full px-1.5 py-0.5 font-medium text-[#ed6203] text-sm">
              Flagship Exhibition 2026
            </span>
            <h2 className="mt-3 max-w-md font-medium text-3xl leading-10">
              Vietnam International Food & Beverage Expo 2026
            </h2>
            <p className="mt-3 max-w-md leading-6">
              Connecting world-class F&B suppliers with professional buyers and
              distributors in a unified...
            </p>
          </div>
          <div>
            <p className="mb-3 text-center font-bold text-sm tracking-[0.35em]">
              COMING SOON
            </p>
            <div className="grid grid-cols-4 gap-3 md:gap-5">
              {countdown.map(([value, label]) => (
                <div key={label} className="text-center">
                  <div className="rounded-xl border-[#ed6203] border-b-2 bg-white/30 p-3 text-2xl backdrop-blur">
                    {value}
                  </div>
                  <div className="mt-2 text-[#d1d5db] text-sm">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-h-[180px] overflow-hidden rounded-[20px] border-2 border-white/50">
            <Image
              src={tenantAssets.expoVideo}
              alt="Expo preview"
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <PlayCircle className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 text-white/80" />
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-center gap-5">
        <span className="size-2 rounded-full bg-[#ed6203]" />
        <span className="size-2 rounded-full bg-[#e5e7eb]" />
        <span className="size-2 rounded-full bg-[#e5e7eb]" />
      </div>
    </SectionShell>
  )
}
