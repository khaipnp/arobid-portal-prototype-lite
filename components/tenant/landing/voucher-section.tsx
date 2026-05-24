import { Flame } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { voucherCards } from "@/lib/tenant/landing-data"
import { OrangeButton, SectionShell } from "./shared"

export function VoucherSection() {
  const [featured, ...cards] = voucherCards

  return (
    <SectionShell className="bg-white">
      <div className="mb-6 flex items-center gap-2 font-bold text-legend text-xl">
        <Flame className="size-7 fill-legend" />
        <span>HOT DEAL</span>
        <span>•</span>
        <span>BRAND EVOUCHER</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[424px_1fr]">
        <div className="relative min-h-[424px] overflow-hidden rounded-xl">
          <Image
            src={featured.image}
            alt="Exclusive coffee voucher"
            fill
            sizes="(min-width: 1024px) 424px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent to-[#000e33]/80" />
          <OrangeButton className="absolute bottom-8 left-1/2 -translate-x-1/2">
            Claim eVoucher
          </OrangeButton>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {cards.map((card, index) => (
            <div
              key={card.image}
              className="relative min-h-[204px] overflow-hidden rounded-xl"
            >
              <Image
                src={card.image}
                alt={`Brand eVoucher ${index + 1}`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-[#000e33]/70" />
              <Button className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white px-6 py-2 font-medium text-[#1f2937] text-sm">
                Claim eVoucher
              </Button>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}
