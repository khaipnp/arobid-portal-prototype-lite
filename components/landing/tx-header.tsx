import Image from "next/image"
import Link from "next/link"
import { getAuthenticatedUserById } from "@/lib/auth/service"
import { getCurrentSessionUserId } from "@/lib/auth/session"
import { LoginLink } from "./login-link"
import { UserMenu } from "./user-menu"

export async function TxHeader() {
  const userId = await getCurrentSessionUserId()
  const user = userId ? await getAuthenticatedUserById(userId) : null

  return (
    <header className="sticky top-0 z-50 h-17 border-black/5 border-b bg-white/95 backdrop-blur">
      <section className="container mx-auto flex h-full items-center gap-8">
        <Link href="/" aria-label="Arobid TradeXpo">
          <Image
            src="/landing/logo.svg"
            alt="Arobid logo"
            width={1000}
            height={1000}
            className="h-10 w-fit"
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
        <div className="ml-auto flex items-center gap-4">
          {user ? <UserMenu user={user} /> : <LoginLink />}
        </div>
      </section>
    </header>
  )
}
