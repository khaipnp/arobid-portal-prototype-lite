"use client"

import {
  BrickWallShieldIcon,
  Grid3x2Icon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  MonitorPlayIcon,
  PackageCheckIcon,
  ReceiptIcon,
  ShapesIcon,
  ShieldCheckIcon,
  TicketIcon,
  ToyBrickIcon,
  UserRoundKeyIcon,
  WalletCardsIcon
} from "lucide-react"
import Link from "next/link"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"

const tradexpoLinks = [
  {
    name: "Overview",
    url: "/admin/tradexpo",
    icon: <LayoutDashboardIcon />
  },
  {
    name: "Expo List",
    url: "/admin/tradexpo/expos",
    icon: <Grid3x2Icon />
  },
  {
    name: "Hall Templates",
    url: "/admin/tradexpo/hall-templates",
    icon: <LayoutTemplateIcon />
  },
  {
    name: "Booth Templates",
    url: "/admin/tradexpo/booth-templates",
    icon: <ToyBrickIcon />
  }
]

const servicesLinks = [
  {
    name: "Host Dashboard",
    url: "/admin/streaming",
    icon: <MonitorPlayIcon />
  },
  {
    name: "Order Management",
    url: "/admin/orders",
    icon: <ReceiptIcon />
  },
  {
    name: "eVoucher",
    url: "/admin/evoucher",
    icon: <TicketIcon />
  },
  {
    name: "Plan Packages",
    url: "/admin/plan-subscriptions/packages",
    icon: <PackageCheckIcon />
  },
  {
    name: "Payment Management",
    url: "/admin/settings/payment-management",
    icon: <WalletCardsIcon />
  }
]

const administrationLinks = [
  {
    name: "Modules",
    url: "/admin/administration/modules",
    icon: <ShieldCheckIcon />
  },
  {
    name: "Roles",
    url: "/admin/administration/roles",
    icon: <UserRoundKeyIcon />
  },
  {
    name: "Features",
    url: "/admin/administration/features",
    icon: <ShapesIcon />
  },
  {
    name: "Permissions",
    url: "/admin/administration/permissions",
    icon: <BrickWallShieldIcon />
  }
]

export function NavAdmin() {
  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="select-none">TradeXpo</SidebarGroupLabel>
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
        <SidebarGroupLabel className="select-none">
          Service Management
        </SidebarGroupLabel>
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
        <SidebarGroupLabel className="select-none">
          Administration
        </SidebarGroupLabel>
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
