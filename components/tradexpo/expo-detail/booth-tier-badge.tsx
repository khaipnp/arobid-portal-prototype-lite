import Image from "next/image"
import { cn } from "@/lib/utils"

type Tier = "basic" | "professional" | "premium"

export function BoothTierBadge({
  tier,
  className
}: {
  tier: Tier
  className?: string
}) {
  const configs = {
    basic: {
      label: "Basic",
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      icon: null
    },
    professional: {
      label: "Professional",
      bgColor: "bg-[#FFEFE6]",
      textColor: "text-[#663014]",
      icon: "/landing/booking/flash-sparkle.svg"
    },
    premium: {
      label: "Premium",
      bgColor: "bg-[#F0F7FF]",
      textColor: "text-[#003366]",
      icon: "/landing/booking/flash-sparkle.svg" // Reuse for now or update if distinct icon exists
    }
  }

  const config = configs[tier]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold text-[10px] uppercase tracking-wider w-fit",
        config.bgColor,
        config.textColor,
        className
      )}
    >
      {config.icon && (
        <Image
          src={config.icon}
          alt=""
          width={512}
          height={512}
          className="shrink-0 size-4"
        />
      )}
      {config.label}
    </div>
  )
}
