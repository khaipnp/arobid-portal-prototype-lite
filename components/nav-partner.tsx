"use client"

import {
  BoxesIcon,
  Building2Icon,
  CalendarIcon,
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

const partnerLinks = [
  {
    name: "Expo Programs",
    url: "/partner/expos",
    icon: <CalendarIcon />
  },
  {
    name: "Enterprises & Members",
    url: "/partner/enterprises",
    icon: <UsersIcon />
  },
  {
    name: "Quota & TradeCredits",
    url: "/partner/quota",
    icon: <WalletCardsIcon />
  },
  {
    name: "Service Bundles",
    url: "/partner/bundles",
    icon: <BoxesIcon />
  },
  {
    name: "Communications",
    url: "/partner/communications",
    icon: <MessageSquareIcon />
  },
  {
    name: "Finance & Settlement",
    url: "/partner/finance",
    icon: <Building2Icon />
  },
  {
    name: "Analytics & Reports",
    url: "/partner/analytics",
    icon: <PieChartIcon />
  }
]

export function NavPartner() {
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
      <SidebarGroupLabel className="select-none">
        Partner Portal
      </SidebarGroupLabel>
      <SidebarMenu>
        {partnerLinks.map((item) => (
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
