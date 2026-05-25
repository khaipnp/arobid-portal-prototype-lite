"use client"

import {
  ApertureIcon,
  ChevronRightIcon,
  FileChartPieIcon,
  LayoutDashboardIcon,
  NetworkIcon,
  PieChartIcon,
  UserCogIcon,
  WalletCardsIcon
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NotificationNavLink } from "@/components/notifications/notification-nav-link"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar"
import type { PartnerAccess } from "@/lib/partner/access"
import type { PartnerModule } from "@/lib/partner/core"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "./ui/collapsible"

type PartnerNavItem = {
  name: string
  url: string
  module: PartnerModule
  icon: React.ReactNode
  items?: { title: string; url: string }[]
  isActive?: boolean
}

const siteManagementLinks = {
  navMain: [
    {
      name: "Partner Site Management",
      module: "site_settings",
      icon: NetworkIcon,
      isActive: true,
      items: [
        {
          name: "Site Setting",
          url: "/partner/partner-site/site-management"
        },
        {
          name: "Enterprises Management",
          url: "/partner/partner-site/enterprises"
        },
        { name: "Invitations", url: "/partner/partner-site/invitations" }
      ]
    },
    {
      name: "Expo Programs",
      module: "expo_programs",
      icon: ApertureIcon,
      isActive: true,
      items: [
        {
          name: "Dashboard",
          url: "/partner/expo-program/dashboard"
        },
        {
          name: "Expo Settings",
          url: "/partner/expo-program/expos"
        },
        { name: "Invitations", url: "/partner/expo-program/invitations" }
      ]
    },
    {
      name: "Package Management",
      module: "package_management",
      icon: WalletCardsIcon,
      isActive: true,
      items: [
        {
          name: "Bundle Creation",
          url: "/partner/package-management/bundle-creation"
        },
        {
          name: "Bundle Pricing",
          url: "/partner/package-management/bundle-pricing"
        }
      ]
    },
    {
      name: "Data Center",
      module: "package_management",
      icon: FileChartPieIcon,
      isActive: true,
      items: [
        {
          name: "Enterprise Reports",
          url: "/partner/package-management/bundle-creation"
        },
        {
          name: "Expo Reports",
          url: "/partner/package-management/bundle-pricing"
        },
        {
          name: "Trade Reports",
          url: "/partner/package-management/bundle-pricing"
        },
        {
          name: "Credit & Revenue Reports",
          url: "/partner/package-management/bundle-pricing"
        },
        {
          name: "Buyer Lead Reports",
          url: "/partner/package-management/bundle-pricing"
        }
      ]
    }
  ]
}

const activityLinks = [
  {
    name: "TradeCredit Reports",
    url: "/partner/tradecredit",
    module: "tradecredit_reports",
    icon: <WalletCardsIcon />
  },
  {
    name: "Analytics",
    url: "/partner/analytics",
    module: "analytics_reports",
    icon: <PieChartIcon />
  }
] satisfies PartnerNavItem[]

const configurationLinks = [
  {
    name: "User Management",
    url: "/partner/users",
    module: "overview",
    icon: <UserCogIcon />
  }
] satisfies PartnerNavItem[]

function filterVisibleLinks(links: PartnerNavItem[], access?: PartnerAccess) {
  return links.filter((item) => access?.modules[item.module] ?? false)
}

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

export function NavPartner({ access }: { access?: PartnerAccess }) {
  const pathname = usePathname()
  const showDashboard = access?.modules.overview ?? false
  const visibleActivityLinks = filterVisibleLinks(activityLinks, access)
  const visibleConfigurationLinks = filterVisibleLinks(
    configurationLinks,
    access
  )
  const activeLinks = [
    ...(showDashboard ? [{ url: "/partner" }] : []),
    { url: "/partner/notifications" },
    ...siteManagementLinks.navMain.flatMap((item) => item.items ?? []),
    ...visibleActivityLinks,
    ...visibleConfigurationLinks
  ]
  const activeHref = activeLinks
    .filter(
      (item) => pathname === item.url || pathname.startsWith(`${item.url}/`)
    )
    .sort((a, b) => b.url.length - a.url.length)[0]?.url

  return (
    <SidebarGroup>
      <SidebarMenu>
        {showDashboard ? (
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActiveHref(pathname, "/partner", activeHref)}
            >
              <Link
                href="/partner"
                aria-current={
                  isActiveHref(pathname, "/partner", activeHref)
                    ? "page"
                    : undefined
                }
              >
                <LayoutDashboardIcon />
                <span>Overview</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : null}
      </SidebarMenu>
      <SidebarMenu>
        <NotificationNavLink href="/partner/notifications" />
      </SidebarMenu>
      <SidebarMenu>
        {siteManagementLinks.navMain.map((item) => (
          <Collapsible
            key={item.name}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.name}>
                  {item.icon && <item.icon />}
                  <span>{item.name}</span>
                  <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.name}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={isActiveHref(
                          pathname,
                          subItem.url,
                          activeHref
                        )}
                      >
                        <Link
                          href={subItem.url}
                          aria-current={
                            isActiveHref(pathname, subItem.url, activeHref)
                              ? "page"
                              : undefined
                          }
                        >
                          <span>{subItem.name}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
      <SidebarMenu>
        {visibleActivityLinks.map((item) => (
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

      {visibleConfigurationLinks.length > 0 ? (
        <>
          <SidebarGroupLabel className="select-none">
            Configurations
          </SidebarGroupLabel>
          <SidebarMenu>
            {visibleConfigurationLinks.map((item) => (
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
        </>
      ) : null}
    </SidebarGroup>
  )
}
