"use client"

import {
  CalendarIcon,
  LayoutDashboardIcon,
  RadioIcon,
  Settings2Icon,
  UsersIcon
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

const expoOwnerLinks = [
  {
    name: "My Expos",
    url: "/partner/expos",
    icon: <CalendarIcon />
  },
  {
    name: "Settings",
    url: "/partner/settings",
    icon: <Settings2Icon />
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
              <span>Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarMenu>
        <NotificationNavLink href="/partner/notifications" />
      </SidebarMenu>
      <SidebarGroupLabel className="select-none">
        Expo Management
      </SidebarGroupLabel>
      <SidebarMenu>
        {expoOwnerLinks.map((item) => (
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
