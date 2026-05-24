import Image from "next/image"
import { tenantAssets } from "@/lib/tenant/landing-data"
import { OrangeButton, TBSGLogo } from "./shared"

export function CtaSection() {
  return (
    <section className="relative min-h-[360px] overflow-hidden lg:min-h-[440px]">
      <Image
        src={tenantAssets.ctaBg}
        alt="Global business network"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-b from-[#eff2f7]/0 to-[#e0ecff] backdrop-blur-[2px]" />
      <div className="relative mx-auto flex min-h-[360px] max-w-[849px] flex-col items-center justify-center px-5 text-center lg:min-h-[440px]">
        <TBSGLogo src={tenantAssets.logoTbsg} className="h-[62px] w-[205px]" />
        <h2 className="mt-2 font-medium text-3xl text-[#030712] leading-10 md:text-[32px]">
          Ready to grow your business globally?
        </h2>
        <p className="mt-2 text-[#1f2937] leading-6">
          Connect with thousands of businesses in the TBSG community to scale
          your reach and shape your future.
        </p>
        <OrangeButton className="mt-6">Join TBSG Now</OrangeButton>
      </div>
    </section>
  )
}
