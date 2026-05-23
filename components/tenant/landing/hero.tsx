import Image from "next/image"
import { tenantAssets } from "@/lib/tenant/landing-data"
import { SearchBar } from "./shared"

export function TenantHero() {
  return (
    <section className="relative min-h-[620px] overflow-hidden lg:min-h-[810px]">
      <Image
        src={tenantAssets.heroCity}
        alt="Ho Chi Minh City skyline"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 bg-linear-[119deg,rgba(0,11,42,0.8)_0%,rgba(0,11,42,0)_100%]" />
      <div className="relative mx-auto flex min-h-[620px] max-w-[1284px] items-center px-5 md:px-8 lg:min-h-[810px] xl:px-0">
        <div className="max-w-[580px] text-white">
          <h1 className="font-normal text-4xl leading-tight tracking-tight md:text-5xl md:leading-[56px]">
            TBSG <span className="font-bold text-[#f97316]">Business HUB</span>
          </h1>
          <p className="mt-3 max-w-[504px] font-medium text-lg leading-7">
            Accelerate your business with AI-powered trade connections and
            direct policy access.
          </p>
          <SearchBar inverted className="mt-8 max-w-[580px]" />
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium text-base">Popular:</span>
            {["Coffee", "Furniture", "Agriculture"].map((item) => (
              <span
                key={item}
                className="rounded-md bg-white/30 px-3 py-1 backdrop-blur"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
