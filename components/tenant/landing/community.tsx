import { ArrowUpRight } from "lucide-react"
import Image from "next/image"
import {
  communityFeatures,
  stats,
  tenantAssets
} from "@/lib/tenant/landing-data"
import { OrangeButton, SectionShell } from "./shared"

function CommunityCard({ item }: { item: (typeof communityFeatures)[number] }) {
  const isLarge = item.size === "large"
  return (
    <article
      className={
        isLarge
          ? "group relative min-h-[370px] overflow-hidden rounded-xl bg-[#f3f4f6]"
          : "group relative min-h-[110px] overflow-hidden rounded-xl bg-[#f3f4f6] md:min-h-[175px]"
      }
    >
      <Image
        src={item.image}
        alt=""
        fill
        sizes="(min-width: 1024px) 33vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-b from-transparent to-[#eff2f7]" />
      <div className="absolute bottom-6 left-6">
        <h3 className="font-semibold text-[#030712] text-xl leading-7">
          {item.title}
        </h3>
        <p className="mt-1 text-[#6b7280] text-sm">{item.description}</p>
      </div>
      <button
        type="button"
        className="absolute right-6 bottom-8 grid size-10 place-items-center rounded-full border border-white bg-[#f3f4f6]"
        aria-label={item.title}
      >
        <ArrowUpRight className="size-5" />
      </button>
    </article>
  )
}

export function CommunitySection() {
  const [large, ...rest] = communityFeatures

  return (
    <SectionShell className="relative overflow-hidden bg-white">
      <Image
        src={tenantAssets.communityPattern}
        alt=""
        width={900}
        height={480}
        sizes="70vw"
        className="pointer-events-none absolute top-0 right-0 hidden w-[70%] opacity-20 mix-blend-multiply lg:block"
      />
      <div className="relative space-y-10">
        <div className="space-y-4">
          <h2 className="font-medium text-3xl leading-10 tracking-tight md:text-[32px]">
            The Power of TBSG Community
          </h2>
          <OrangeButton>Join TBSG Now</OrangeButton>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {stats.map(([value, label]) => (
            <div key={label} className="border-l pl-4">
              <p className="font-medium text-4xl text-[#1f2937] leading-11">
                {value}
              </p>
              <p className="mt-2 text-[#6b7280]">{label}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <CommunityCard item={large} />
          <div className="grid gap-5">
            {rest.slice(0, 2).map((item) => (
              <CommunityCard key={item.title} item={item} />
            ))}
          </div>
          <div className="grid gap-5">
            {rest.slice(2).map((item) => (
              <CommunityCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
