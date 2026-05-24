"use client";

import {
  ApertureIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  PaletteIcon,
  PieChartIcon,
  UserCogIcon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { NotificationNavLink } from "@/components/notifications/notification-nav-link";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { PartnerAccess } from "@/lib/partner/access";
import type { PartnerModule } from "@/lib/partner/core";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

type PartnerNavItem = {
  name: string;
  url: string;
  module: PartnerModule;
  icon: React.ReactNode;
  items?: { title: string; url: string }[];
  isActive?: boolean;
};

const siteManagementLinks = {
  navMain: [
    {
      name: "Site Settings",
      module: "site_settings",
      icon: ApertureIcon,
      isActive: true,
      items: [
        {
          name: "Site Setting",
          url: "/partner/partner-site/site-settings",
        },
        {
          name: "Enterprises Management",
          url: "/partner/partner-site/enterprises",
        },
        { name: "Invitations", url: "/partner/partner-site/invitations" },
      ],
    },
    {
      name: "Expo Programs",
      module: "expo_programs",
      icon: ApertureIcon,
      isActive: true,
      items: [
        {
          name: "Dashboard",
          url: "/partner/expo-program/dashboard",
        },
        {
          name: "Expo Settings",
          url: "/partner/expo-program/expos",
        },
        { name: "Invitations", url: "/partner/expo-program/invitations" },
      ],
    },
    {
      name: "Package Management",
      module: "package_management",
      icon: ApertureIcon,
      isActive: true,
      items: [
        {
          name: "Bundle Creation",
          url: "/partner/package-management/bundle-creation",
        },
        {
          name: "Bundle Pricing",
          url: "/partner/package-management/bundle-pricing",
        },
      ],
    },
  ],
};

const activityLinks = [
  {
    name: "Expo Programs",
    url: "/partner/expos",
    module: "expo_programs",
    icon: <ApertureIcon />,
  },
  {
    name: "TradeCredit Reports",
    url: "/partner/tradecredit",
    module: "tradecredit_reports",
    icon: <WalletCardsIcon />,
  },
  {
    name: "Analytics",
    url: "/partner/analytics",
    module: "analytics_reports",
    icon: <PieChartIcon />,
  },
] satisfies PartnerNavItem[];

const configurationLinks = [
  {
    name: "User Management",
    url: "/partner/users",
    module: "overview",
    icon: <UserCogIcon />,
  },
  {
    name: "Mini-site",
    url: "/partner/site-management",
    module: "mini_site",
    icon: <PaletteIcon />,
  },
  {
    name: "Members",
    url: "/partner/enterprises",
    module: "enterprises",
    icon: <UsersIcon />,
  },
] satisfies PartnerNavItem[];

function filterVisibleLinks(links: PartnerNavItem[], access?: PartnerAccess) {
  return links.filter((item) => access?.modules[item.module] ?? false);
}

export function NavPartner({ access }: { access?: PartnerAccess }) {
  const showDashboard = access?.modules.overview ?? false;
  const visibleActivityLinks = filterVisibleLinks(activityLinks, access);
  const visibleConfigurationLinks = filterVisibleLinks(
    configurationLinks,
    access,
  );

  return (
    <SidebarGroup>
      <SidebarMenu>
        {showDashboard ? (
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/partner">
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
                      <SidebarMenuSubButton asChild>
                        <a href={subItem.url}>
                          <span>{subItem.name}</span>
                        </a>
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
            <SidebarMenuButton asChild>
              <Link href={item.url}>
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
                <SidebarMenuButton asChild>
                  <Link href={item.url}>
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
  );
}
