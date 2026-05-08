import { Send } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function TxHeader() {
  return (
    <header className="sticky top-0 z-50 border-black/5 border-b bg-white/95 backdrop-blur">
      <section className="container mx-auto flex h-16 items-center gap-8">
        <Link href="/" aria-label="Arobid TradeXpo">
          <Image
            src="/landing/logo.svg"
            alt="Arobid TradeXpo logo"
            width={156}
            height={40}
          />
        </Link>
        <nav className="hidden flex-1 items-center gap-8 font-medium text-sm md:flex">
          <a href="#shows" className="hover:text-legend-500">
            Virtual Shows
          </a>
          <a href="#ecosystem" className="hover:text-legend-500">
            Ecosystem
          </a>
          <a href="#pricing" className="hover:text-legend-500">
            Pricing
          </a>
        </nav>
        <Link
          href="/seller"
          className="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-legend px-5 font-medium text-sm text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0_0_1px_#f37b42]"
        >
          <Send className="size-4" />
          <span className="hidden sm:inline">Register Booth Lite</span>
        </Link>
      </section>
    </header>
  )
}
