import Image from "next/image"
import { tenantAssets } from "@/lib/tenant/landing-data"
import { OrangeButton, SectionShell } from "./shared"

export function BuyerMatchSection() {
  return (
    <SectionShell className="bg-[#f9fafb]">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className="max-w-[632px]">
          <h2 className="font-medium text-[#ed6203] text-[32px] leading-10">
            Buyer Find & Match
          </h2>
          <p className="mt-3 text-[#1f2937] leading-6">
            Instantly connecting standardized supplier data with verified buyer
            intent for absolute precision in global sourcing.
          </p>
          <OrangeButton className="mt-10">Get Matches Now</OrangeButton>
        </div>
        <Image
          src={tenantAssets.buyerMatchUi}
          alt="AI matching dashboard"
          width={632}
          height={356}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="w-full rounded-xl object-cover"
        />
      </div>
      <Image
        src={tenantAssets.buyerMatchAd}
        alt="Vietcombank banner"
        width={1284}
        height={143}
        sizes="100vw"
        className="mt-10 h-[143px] w-full rounded object-cover"
      />
    </SectionShell>
  )
}
