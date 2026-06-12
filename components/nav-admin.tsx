"use client"

import {
  BadgeCheckIcon,
  BrickWallShieldIcon,
  Building2Icon,
  Grid3x2Icon,
  HistoryIcon,
  ImageIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  MonitorPlayIcon,
  NetworkIcon,
  PackageCheckIcon,
  ReceiptIcon,
  ShapesIcon,
  ShieldCheckIcon,
  TicketIcon,
  ToyBrickIcon,
  UserRoundKeyIcon,
  UsersIcon,
  WalletCardsIcon
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
    name: "TradeCredit",
    url: "/admin/tradecredit",
    icon: <WalletCardsIcon />
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
  },
  {
    name: "Banner Ads",
    url: "/admin/settings/banner-ads",
    icon: <ImageIcon />
  },
  {
    name: "Site Content Builder",
    url: "/admin/settings/site-content-builder",
    icon: <LayoutTemplateIcon />
  },
  {
    name: "Badge Management",
    url: "/admin/settings/badge-management",
    icon: <BadgeCheckIcon />
  }
]

const administrationLinks = [
  {
    name: "Partners",
    url: "/admin/partners",
    icon: <NetworkIcon />
  },
  {
    name: "Partner Audit",
    url: "/admin/partners/association-audit",
    icon: <HistoryIcon />
  },
  {
    name: "Companies",
    url: "/admin/administration/companies",
    icon: <Building2Icon />
  },
  {
    name: "Users",
    url: "/admin/administration/users",
    icon: <UsersIcon />
  },
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

const adminLinks = [...tradexpoLinks, ...servicesLinks, ...administrationLinks]

function isActiveHref(
  pathname: string,
  href: string,
  activeHref: string | undefined
) {
  return (
    activeHref === href &&
    (pathname === href || pathname.startsWith(`${href}/`))
  )
}

export function NavAdmin() {
  const pathname = usePathname()
  const activeHref = adminLinks
    .filter(
      (item) => pathname === item.url || pathname.startsWith(`${item.url}/`)
    )
    .sort((a, b) => b.url.length - a.url.length)[0]?.url

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="select-none">TradeXpo</SidebarGroupLabel>
        <SidebarMenu>
          {tradexpoLinks.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={isActiveHref(pathname, item.url, activeHref)}
              >
                <Link
                  href={item.url}
                  aria-current={
                    isActiveHref(pathname, item.url, activeHref)
                      ? "page"
                      : undefined
                  }
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel className="select-none">
          Service Management
        </SidebarGroupLabel>
        <SidebarMenu>
          {servicesLinks.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={isActiveHref(pathname, item.url, activeHref)}
              >
                <Link
                  href={item.url}
                  aria-current={
                    isActiveHref(pathname, item.url, activeHref)
                      ? "page"
                      : undefined
                  }
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel className="select-none">
          Administration
        </SidebarGroupLabel>
        <SidebarMenu>
          {administrationLinks.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={isActiveHref(pathname, item.url, activeHref)}
              >
                <Link
                  href={item.url}
                  aria-current={
                    isActiveHref(pathname, item.url, activeHref)
                      ? "page"
                      : undefined
                  }
                >
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
