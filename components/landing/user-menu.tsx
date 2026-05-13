"use client"

import {
  BellIcon,
  CogIcon,
  HeartIcon,
  LayoutDashboard,
  ListChecksIcon,
  MessageCircleMoreIcon,
  User
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface UserMenuProps {
  user: {
    id: string
    name: string
    email: string
    roles: string[]
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.refresh()
  }

  const getDashboardPath = () => {
    if (user.roles.includes("admin")) return "/admin"
    if (user.roles.includes("partner")) return "/partner"
    return "/seller"
  }

  const getNotificationPath = () => {
    if (user.roles.includes("admin")) return "/admin/notifications"
    if (user.roles.includes("partner")) return "/partner/notifications"
    return "/seller/notifications"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/avatar.webp" alt={user.name} />
            <AvatarFallback>
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 rounded-2xl px-0 py-3"
        align="end"
        forceMount
      >
        <DropdownMenuItem asChild className="gap-2 rounded-none px-4 py-2.25">
          <Link href={getNotificationPath()}>
            <BellIcon strokeWidth="2" />
            <span className="font-medium">Notifications</span>
          </Link>
        </DropdownMenuItem>
        {!user.roles.includes("admin") && (
          <>
            <DropdownMenuItem
              asChild
              className="gap-2 rounded-none px-4 py-2.25"
            >
              <Link href="/seller/deal-room">
                <MessageCircleMoreIcon strokeWidth="2" />
                <span className="font-medium">Deal Room</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="gap-2 rounded-none px-4 py-2.25"
            >
              <Link href="/seller/deal-room">
                <ListChecksIcon strokeWidth="2" />
                <span className="font-medium">RFQ Hub</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="gap-2 rounded-none px-4 py-2.25"
            >
              <Link href="/seller/deal-room">
                <HeartIcon strokeWidth="2" />
                <span className="font-medium">Wishlist</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="gap-2 rounded-none px-4 py-2.25"
            >
              <Link href="/profile">
                <User strokeWidth="2" />
                <span className="font-medium">Profile</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {/* User Workspace */}

        {/* Partner Portal */}
        {user.roles.includes("partner") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="pl-4">Portal</DropdownMenuLabel>
            <DropdownMenuItem
              className="gap-2 rounded-none px-4 py-2.25"
              asChild
            >
              <Link href={getDashboardPath()}>
                <LayoutDashboard strokeWidth="2" />
                <span className="font-medium">Dashboard</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="gap-2 rounded-none px-4 py-2.25"
              asChild
            >
              <Link href="/partner/settings">
                <CogIcon strokeWidth="2" />
                <span className="font-medium">Settings</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="gap-2 rounded-none px-4 py-2.25"
        >
          <span className="font-normal">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
