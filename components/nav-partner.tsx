"use client"

import {
  ApertureIcon,
  LayoutDashboardIcon,
  PaletteIcon,
  PieChartIcon,
  UserCogIcon,
  UsersIcon,
  WalletCardsIcon
} from "lucide-react"
import Link from "next/link"
import { NotificationNavLink } from "@/components/notifications/notification-nav-link"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import type { PartnerAccess } from "@/lib/partner/access"
import type { PartnerModule } from "@/lib/partner/core"

const partnerLinks = [
  {
    name: "User Management",
    url: "/partner/users",
    module: "overview",
    icon: <UserCogIcon />
  },
  {
    name: "Mini-site",
    url: "/partner/site-management",
    module: "mini_site",
    icon: <PaletteIcon />
  },
  {
    name: "Members",
    url: "/partner/enterprises",
    module: "enterprises",
    icon: <UsersIcon />
  },
  {
    name: "Expo Programs",
    url: "/partner/expos",
    module: "expo_programs",
    icon: <ApertureIcon />
  },
  {
    name: "TradeCredit Reports",
    url: "/partner/tradecredit",
    module: "tradecredit_reports",
    icon: <WalletCardsIcon />
  },
  {
    name: "Analytics",
    url: "/partner/analytics",
    module: "analytics_reports",
    icon: <PieChartIcon />
  }
] satisfies {
  name: string
  url: string
  module: PartnerModule
  icon: React.ReactNode
}[]

export function NavPartner({ access }: { access?: PartnerAccess }) {
  const links = partnerLinks.filter(
    (item) => access?.modules[item.module] ?? false
  )

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/partner">
              <LayoutDashboardIcon />
              <span>Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarMenu>
        <NotificationNavLink href="/partner/notifications" />
      </SidebarMenu>
      <SidebarMenu>
        {links.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link href={item.url}>
                {item.icon}
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
