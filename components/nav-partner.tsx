"use client"

import {
  BellIcon,
  CalendarIcon,
  RadioIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"
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
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/partner/notification">
              <BellIcon />
              <span>Notification</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
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
