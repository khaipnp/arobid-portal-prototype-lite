"use client"

import {
  BoxesIcon,
  Building2Icon,
  CalendarIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  PieChartIcon,
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
import type { PartnerAccess, PartnerPortalTab } from "@/lib/partner/access"

const partnerLinks = [
  {
    name: "Expo Programs",
    url: "/partner/expos",
    tab: "expo",
    icon: <CalendarIcon />
  },
  {
    name: "Enterprises & Members",
    url: "/partner/enterprises",
    tab: "enterprises",
    icon: <UsersIcon />
  },
  {
    name: "Quota & TradeCredits",
    url: "/partner/quota",
    tab: "quota",
    icon: <WalletCardsIcon />
  },
  {
    name: "Service Bundles",
    url: "/partner/bundles",
    tab: "bundles",
    icon: <BoxesIcon />
  },
  {
    name: "Communications",
    url: "/partner/communications",
    tab: "communications",
    icon: <MessageSquareIcon />
  },
  {
    name: "Finance & Settlement",
    url: "/partner/finance",
    tab: "finance",
    icon: <Building2Icon />
  },
  {
    name: "Analytics & Reports",
    url: "/partner/analytics",
    tab: "analytics",
    icon: <PieChartIcon />
  },
  {
    name: "Government Programs",
    url: "/partner/government",
    tab: "government",
    icon: <LandmarkIcon />
  }
]

export function NavPartner({ access }: { access?: PartnerAccess }) {
  const links = partnerLinks.filter(
    (item) => access?.tabs[item.tab as PartnerPortalTab] ?? true
  )

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/partner">
              <LayoutDashboardIcon />
              <span>Overview</span>
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
