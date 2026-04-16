"use client"

import { CalendarIcon, RadioIcon, Settings2Icon, UsersIcon } from "lucide-react"
import Link from "next/link"
import { NotificationNavLink } from "@/components/notifications/notification-nav-link"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const expoOwnerLinks = [
  {
    name: "My Expos",
    url: "/partner/expos",
    icon: <CalendarIcon />,
  },
  {
    name: "GoLIVE",
    url: "/partner/expos",
    icon: <RadioIcon />,
  },
  {
    name: "Exhibitors",
    url: "#",
    icon: <UsersIcon />,
  },
  {
    name: "Settings",
    url: "#",
    icon: <Settings2Icon />,
  },
]

export function NavPartner() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        <NotificationNavLink userId="partner-1" href="/partner/notifications" />
      </SidebarMenu>
      <SidebarGroupLabel>Expo Management</SidebarGroupLabel>
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
