import {
  ChevronDown,
  FileQuestion,
  Flame,
  Globe2,
  Menu,
  User,
  WandSparkles
} from "lucide-react"
import { navItems, tenantAssets } from "@/lib/tenant/landing-data"
import { SearchBar, TBSGLogo } from "./shared"

export function TenantHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-[0_1px_1px_rgba(0,0,0,0.1)]">
      <div className="mx-auto flex max-w-[1296px] items-center gap-6 px-5 py-4 md:px-8 xl:px-0">
        <TBSGLogo src={tenantAssets.logoTbsg} className="h-[54px] w-[182px]" />
        <SearchBar className="hidden max-w-[579px] flex-1 lg:flex" />
        <div className="ml-auto hidden items-center gap-4 lg:flex">
          <button
            type="button"
            className="flex max-w-36 items-center gap-2 text-sm"
          >
            <WandSparkles className="size-5" />
            <span>AI Buyer Find & Match</span>
          </button>
          <button
            type="button"
            className="flex max-w-32 items-center gap-2 text-sm"
          >
            <FileQuestion className="size-5 text-[#022582]" />
            <span>Request for Quotation</span>
          </button>
          <button type="button" className="flex items-center gap-2 text-sm">
            <User className="size-5 text-[#022582]" />
            <span>Sign In/ Join now</span>
          </button>
        </div>
        <button
          type="button"
          className="ml-auto lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </button>
      </div>
      <div className="mx-auto hidden max-w-[1296px] items-center justify-between gap-6 px-5 pb-3 md:px-8 lg:flex xl:px-0">
        <nav className="flex items-center gap-8 text-[#000933] text-sm">
          {navItems.map((item, index) => (
            <button
              type="button"
              key={item}
              className="relative inline-flex items-center gap-2 rounded-lg py-2 font-medium"
            >
              {index === 0 && <Menu className="size-4" />}
              {item === "TradeXpo" ? (
                <span className="font-semibold">
                  Trade<span className="text-[#ed6203]">X</span>po
                </span>
              ) : (
                item
              )}
              {index === 0 && <ChevronDown className="size-3" />}
              {item === "eVoucher Deals" && (
                <span className="absolute -top-2 left-12 inline-flex items-center gap-0.5 rounded-full bg-[#ed6203] px-1 text-[10px] text-white">
                  <Flame className="size-3" /> HOT
                </span>
              )}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg py-2 font-medium text-sm"
        >
          <span className="grid size-4 place-items-center rounded-full bg-[#ff4e4e] text-[9px] text-yellow-300">
            ★
          </span>
          EN - USD
          <ChevronDown className="size-3" />
          <Globe2 className="sr-only size-4" />
        </button>
      </div>
    </header>
  )
}
