import { CheckCircle2, PlayCircle } from "lucide-react"
import Image from "next/image"
import { newsItems, tenantAssets } from "@/lib/tenant/landing-data"
import { OrangeButton, SectionShell } from "./shared"

export function WhyJoinSection() {
  return (
    <SectionShell className="bg-[#f9fafb]">
      <div className="relative overflow-hidden rounded-[20px] border border-white px-5 py-5 text-white lg:px-8">
        <Image
          src={tenantAssets.whyJoinBg}
          alt="TBSG member activity"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#000d30]/75" />
        <div className="relative grid items-center gap-5 lg:grid-cols-[319px_453px_1fr]">
          <div className="rounded-[20px] p-3 backdrop-blur">
            <h2 className="font-semibold text-3xl leading-9">Why join TBSG?</h2>
            <div className="mt-5 space-y-5">
              {[
                "Connecting business partners.",
                "Supporting business transformation.",
                "Expanding global trade channels."
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-white">
                    <CheckCircle2 className="size-5 fill-[#16a34a] text-white" />
                  </span>
                  <span className="font-medium leading-6">{item}</span>
                </div>
              ))}
            </div>
            <OrangeButton className="mt-5 h-8 min-w-[180px]">
              Join TBSG Now
            </OrangeButton>
          </div>
          <div className="relative min-h-[257px] overflow-hidden rounded-[14px] border border-white">
            <Image
              src={tenantAssets.whyJoinVideo}
              alt="TBSG video preview"
              fill
              sizes="(min-width: 1024px) 453px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <PlayCircle className="absolute top-1/2 left-1/2 size-20 -translate-x-1/2 -translate-y-1/2 fill-white text-white" />
          </div>
          <div className="rounded-[20px] border border-white bg-white p-3 text-[#1f2937] backdrop-blur">
            <div className="space-y-5">
              {newsItems.map((item) => (
                <article key={item} className="flex gap-2">
                  <Image
                    src={tenantAssets.whyJoinNews}
                    alt="TBSG news"
                    width={60}
                    height={60}
                    sizes="60px"
                    className="size-[60px] rounded-lg object-cover"
                  />
                  <h3 className="font-medium text-sm leading-5">{item}</h3>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
