"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "../ui/button"

export function LoginLink() {
  const pathname = usePathname()
  const loginUrl =
    pathname === "/login"
      ? "/login"
      : `/login?callbackUrl=${encodeURIComponent(pathname)}`

  return (
    <Link href={loginUrl}>
      <Button variant="ghost" className="font-medium">
        Login or Sign in
      </Button>
    </Link>
  )
}
