"use client"

import {
  BrickWallShieldIcon,
  CreditCardIcon,
  Grid3x2Icon,
  LandmarkIcon,
  LayoutDashboardIcon,
  LayoutPanelTopIcon,
  LayoutTemplateIcon,
  MonitorPlayIcon,
  PieChartIcon,
  ReceiptIcon,
  ShapesIcon,
  ShieldCheckIcon,
  TicketIcon,
  ToyBrickIcon,
  UserRoundKeyIcon,
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
    name: "Overview",
    url: "/admin/tradexpo",
    icon: <LayoutDashboardIcon />,
  },
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

const servicesLinks = [
  {
    name: "Host Dashboard",
    url: "/admin/streaming",
    icon: <MonitorPlayIcon />,
  },
  {
    name: "Order Management",
    url: "/admin/orders",
    icon: <ReceiptIcon />,
  },
  {
    name: "eVoucher",
    url: "/admin/evoucher",
    icon: <TicketIcon />,
  },
  {
    name: "Payment Method",
    url: "/admin/settings/payment-method",
    icon: <CreditCardIcon />,
  },
  {
    name: "Bank Accounts",
    url: "/admin/settings/bank-accounts",
    icon: <LandmarkIcon />,
  },
]

const administrationLinks = [
  {
    name: "Modules",
    url: "/admin/administration/modules",
    icon: <ShieldCheckIcon />,
  },
  {
    name: "Roles",
    url: "/admin/administration/roles",
    icon: <UserRoundKeyIcon />,
  },
  {
    name: "Features",
    url: "/admin/administration/features",
    icon: <ShapesIcon />,
  },
  {
    name: "Permissions",
    url: "/admin/administration/permissions",
    icon: <BrickWallShieldIcon />,
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
        <SidebarGroupLabel>Service Management</SidebarGroupLabel>
        <SidebarMenu>
          {servicesLinks.map((item) => (
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
