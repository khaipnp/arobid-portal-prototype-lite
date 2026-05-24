import {
  ChevronDown,
  FileQuestion,
  Globe2,
  Menu,
  User,
  WandSparkles
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { navItems, tenantAssets } from "@/lib/tenant/landing-data"
import { SearchBar, TBSGLogo } from "./shared"

export function TenantHeader() {
  return (
    <header className="sticky top-0 z-50 space-y-3 border-b bg-white py-3">
      <div className="container mx-auto flex items-center gap-6">
        <TBSGLogo src={tenantAssets.logoTbsg} className="h-13 w-44" />
        <SearchBar />
        <div className="ml-auto hidden items-center gap-4 lg:flex">
          <Button variant="ghost">
            <WandSparkles />
            AI Buyer Find & Match
          </Button>

          <Button variant="ghost">
            <FileQuestion />
            RFQs
          </Button>
          <Link href="/login">
            <Button variant="ghost">
              <User />
              Sign In
            </Button>
          </Link>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </Button>
      </div>
      <div className="container mx-auto hidden items-center justify-between gap-6 lg:flex">
        <nav className="flex items-center">
          {navItems.map((item, index) =>
            item === "TradeXpo" ? (
              <Button
                asChild
                variant="ghost"
                size="md"
                key={item}
                className="rounded-full font-semibold"
              >
                <Link href="/tradexpo">
                  Trade<span className="text-legend">X</span>po
                </Link>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="md"
                key={item}
                className="gap-1.5 rounded-full"
              >
                {index === 0 && <Menu />}
                {item}
                {index === 0 && <ChevronDown />}
              </Button>
            )
          )}
        </nav>
        <Button
          variant="ghost"
          size="md"
          className="flex items-center gap-2 rounded-lg py-2 font-medium text-sm"
        >
          <span className="grid size-4 place-items-center rounded-full bg-red-500 text-[9px] text-yellow-400">
            ★
          </span>
          EN - USD
          <ChevronDown className="size-3" />
          <Globe2 className="sr-only" />
        </Button>
      </div>
    </header>
  )
}
