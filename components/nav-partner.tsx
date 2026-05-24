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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import type { PartnerAccess } from "@/lib/partner/access"
import type { PartnerModule } from "@/lib/partner/core"

type PartnerNavItem = {
  name: string
  url: string
  module: PartnerModule
  icon: React.ReactNode
}

const activityLinks = [
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
] satisfies PartnerNavItem[]

const configurationLinks = [
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
  }
] satisfies PartnerNavItem[]

function filterVisibleLinks(links: PartnerNavItem[], access?: PartnerAccess) {
  return links.filter((item) => access?.modules[item.module] ?? false)
}

export function NavPartner({ access }: { access?: PartnerAccess }) {
  const showDashboard = access?.modules.overview ?? false
  const visibleActivityLinks = filterVisibleLinks(activityLinks, access)
  const visibleConfigurationLinks = filterVisibleLinks(
    configurationLinks,
    access
  )

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="select-none">Activity</SidebarGroupLabel>
      <SidebarMenu>
        {showDashboard ? (
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/partner">
                <LayoutDashboardIcon />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : null}
      </SidebarMenu>
      <SidebarMenu>
        <NotificationNavLink href="/partner/notifications" />
      </SidebarMenu>
      <SidebarMenu>
        {visibleActivityLinks.map((item) => (
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

      {visibleConfigurationLinks.length > 0 ? (
        <>
          <SidebarGroupLabel className="select-none">
            Configurations
          </SidebarGroupLabel>
          <SidebarMenu>
            {visibleConfigurationLinks.map((item) => (
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
        </>
      ) : null}
    </SidebarGroup>
  )
}
