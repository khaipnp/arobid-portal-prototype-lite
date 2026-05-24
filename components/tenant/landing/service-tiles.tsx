import { ArrowRightCircle } from "lucide-react"
import Image from "next/image"
import { serviceTiles, tenantAssets } from "@/lib/tenant/landing-data"
import { cn } from "@/lib/utils"
import { SectionShell } from "./shared"

export function ServiceTiles() {
  return (
    <SectionShell className="bg-[#f9fafb]">
      <div className="grid gap-6 lg:grid-cols-3">
        {serviceTiles.map((tile) => (
          <article
            key={tile.title}
            className="relative min-h-[180px] overflow-hidden rounded-xl border border-[#e0f2fe] p-5"
          >
            <Image
              src={tenantAssets.serviceCardBg}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover"
            />
            <Image
              src={tile.image}
              alt=""
              width={150}
              height={127}
              sizes="150px"
              className="absolute top-4 right-4 h-[127px] w-[150px] object-contain"
            />
            <div className="relative max-w-[214px]">
              <h2 className="font-semibold text-[#030712] text-lg leading-7">
                {tile.title}
              </h2>
              <p className="mt-3 font-medium text-[#6b7280] leading-6">
                {tile.description}
              </p>
              <button
                type="button"
                className={cn(
                  "mt-3 inline-flex h-10 items-center gap-2 rounded-full px-4 font-medium text-base",
                  tile.primary
                    ? "bg-[#ed6203] text-white"
                    : "border border-[#f37b42] bg-[#f9fafb] text-[#ed6203]"
                )}
              >
                {tile.button}
                <ArrowRightCircle className="size-5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  )
}
