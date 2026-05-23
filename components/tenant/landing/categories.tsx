import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { categoryItems } from "@/lib/tenant/landing-data"
import { SectionHeading, SectionShell } from "./shared"

export function CategorySection() {
  return (
    <SectionShell className="bg-[#f9fafb]">
      <SectionHeading title="Browse by Categories" centered />
      <div className="relative rounded-xl bg-white px-10 py-6 shadow-[0_1px_12px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          aria-label="Previous categories"
          className="absolute top-1/2 left-3 -translate-y-1/2"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-8">
          {categoryItems.map((item) => (
            <button
              type="button"
              key={item.name}
              className="flex flex-col items-center gap-2 rounded-lg text-center"
            >
              <Image
                src={item.image}
                alt=""
                width={79}
                height={79}
                sizes="79px"
                className="size-[79px] rounded-full object-cover"
              />
              <span className="min-h-12 text-[#1f2937] text-sm leading-6">
                {item.name}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Next categories"
          className="absolute top-1/2 right-3 -translate-y-1/2"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </SectionShell>
  )
}
