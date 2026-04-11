"use client"

import {
  Grid3x2Icon,
  LayoutPanelTopIcon,
  LayoutTemplateIcon,
  PieChartIcon,
  ShieldCheckIcon,
  ToyBrickIcon,
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

const b2bMarketplaceLinks = [
  {
    name: "Hall Templates",
    url: "/admin/tradexpo/hall-templates",
    icon: <PieChartIcon />,
  },
  {
    name: "Booth Templates",
    url: "/admin/tradexpo/booth-templates",
    icon: <LayoutPanelTopIcon />,
  },
]

const tradexpoLinks = [
  {
    name: "Expo List",
    url: "/admin/tradexpo/expos",
    icon: <Grid3x2Icon />,
  },
  {
    name: "Hall Templates",
    url: "/admin/tradexpo/hall-templates",
    icon: <LayoutTemplateIcon />,
  },
  {
    name: "Booth Templates",
    url: "/admin/tradexpo/booth-templates",
    icon: <ToyBrickIcon />,
  },
]

const administrationLinks = [
  {
    name: "Modules",
    url: "/admin/administration/roles",
    icon: <ShieldCheckIcon />,
  },
  {
    name: "Roles",
    url: "/admin/administration/permissions",
    icon: <UsersIcon />,
  },
  {
    name: "Features",
    url: "/admin/administration/permissions",
    icon: <UsersIcon />,
  },
  {
    name: "Permissions",
    url: "/admin/administration/permissions",
    icon: <UsersIcon />,
  },
  {
    name: "Plans",
    url: "/admin/administration/permissions",
    icon: <UsersIcon />,
  },
  {
    name: "Packages",
    url: "/admin/administration/permissions",
    icon: <UsersIcon />,
  },
]

export function NavAdmin() {
  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>B2B Marketplace</SidebarGroupLabel>
        <SidebarMenu>
          {b2bMarketplaceLinks.map((item) => (
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
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>TradeXpo</SidebarGroupLabel>
        <SidebarMenu>
          {tradexpoLinks.map((item) => (
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

      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Administration</SidebarGroupLabel>
        <SidebarMenu>
          {administrationLinks.map((item) => (
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
    </>
  )
}
