import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { partnerLogos } from "@/lib/tenant/landing-data"
import { SectionHeading, SectionShell } from "./shared"

export function PartnersSection() {
  return (
    <SectionShell className="relative bg-white">
      <SectionHeading title="Our Partners" centered />
      <div className="relative px-8">
        <button
          type="button"
          aria-label="Previous partners"
          className="absolute top-1/2 left-0 -translate-y-1/2"
        >
          <ChevronLeft className="size-5 text-[#6b7280]" />
        </button>
        <div className="grid grid-cols-3 place-items-center gap-x-5 gap-y-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9">
          {partnerLogos.map((logo) => (
            <div key={logo.id} className="relative size-[100px]">
              <Image
                src={logo.image}
                alt="Partner logo"
                fill
                sizes="100px"
                className="object-contain"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          aria-label="Next partners"
          className="absolute top-1/2 right-0 -translate-y-1/2"
        >
          <ChevronRight className="size-5 text-[#6b7280]" />
        </button>
      </div>
    </SectionShell>
  )
}
