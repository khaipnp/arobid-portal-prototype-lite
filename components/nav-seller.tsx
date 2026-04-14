"use client"

import {
  BoxIcon,
  Building2Icon,
  CalendarIcon,
  MessageCircleIcon,
  ScrollTextIcon,
} from "lucide-react"
import Link from "next/link"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const nav = [
  {
    name: "My Expos",
    url: "/seller/my-expos",
    icon: <CalendarIcon />,
  },
]

const b2b = [
  {
    name: "Supplier Profile",
    url: "/seller/b2b-marketplace",
    icon: <Building2Icon />,
  },
  {
    name: "Product Management",
    url: "/seller/product-management",
    icon: <BoxIcon />,
  },
  {
    name: "RFQ Hub",
    url: "/seller/rfq-hub",
    icon: <ScrollTextIcon />,
  },
]

export function NavSeller() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/seller/deal-room">
              <MessageCircleIcon />
              <span>Deal Room</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
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
      <SidebarGroupLabel>B2B Marketplace</SidebarGroupLabel>
      <SidebarMenu>
        {b2b.map((item) => (
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
