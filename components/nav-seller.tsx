"use client"

import {
  CalendarIcon,
} from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

const nav = [
  {
    name: "My Expos",
    url: "/seller/my-expos",
    icon: <CalendarIcon />
  }
]

export function NavSeller() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>TradeXpo</SidebarGroupLabel>
      <SidebarMenu>
          {nav.map((item) => (
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
