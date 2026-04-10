"use client"

import {
  AudioLinesIcon,
  BookOpenIcon,
  BotIcon,
  BoxIcon,
  CalendarIcon,
  GalleryVerticalEndIcon,
  LayoutPanelTopIcon,
  PieChartIcon,
  Settings2Icon,
  TerminalIcon,
  TerminalSquareIcon,
  UsersIcon,
} from "lucide-react"
import type * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { PortalSwitcher } from "@/components/portal-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavTradeXpo } from "./nav-tradexpo"

export type PortalType = "admin" | "partner" | "seller"

const user = {
  name: "Khai Pham",
  email: "khaipham@arobid.com",
  avatar: "/avatar.webp",
}

const portals = [
  {
    name: "Admin Portal",
    logo: <GalleryVerticalEndIcon />,
    plan: "Admin View",
    url: "/admin",
  },
  {
    name: "Partner Portal",
    logo: <AudioLinesIcon />,
    plan: "Expo Owner View",
    url: "/partner",
  },
  {
    name: "Supplier Portal",
    logo: <TerminalIcon />,
    plan: "Supplier View",
    url: "/seller",
  },
]

const navByPortal: Record<
  PortalType,
  {
    navMain: React.ComponentProps<typeof NavMain>["items"]
    tradexpo?: React.ComponentProps<typeof NavTradeXpo>["projects"]
  }
> = {
  admin: {
    navMain: [
      {
        title: "Playground",
        url: "#",
        icon: <TerminalSquareIcon />,
        isActive: true,
        items: [
          { title: "History", url: "#" },
          { title: "Starred", url: "#" },
          { title: "Settings", url: "#" },
        ],
      },
      {
        title: "Models",
        url: "#",
        icon: <BotIcon />,
        items: [
          { title: "Genesis", url: "#" },
          { title: "Explorer", url: "#" },
          { title: "Quantum", url: "#" },
        ],
      },
      {
        title: "Documentation",
        url: "#",
        icon: <BookOpenIcon />,
        items: [
          { title: "Introduction", url: "#" },
          { title: "Get Started", url: "#" },
          { title: "Tutorials", url: "#" },
          { title: "Changelog", url: "#" },
        ],
      },
      {
        title: "Settings",
        url: "#",
        icon: <Settings2Icon />,
        items: [
          { title: "General", url: "#" },
          { title: "Team", url: "#" },
          { title: "Billing", url: "#" },
          { title: "Limits", url: "#" },
        ],
      },
    ],
    tradexpo: [
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
    ],
  },
  partner: {
    navMain: [
      {
        title: "My Events",
        url: "#",
        icon: <CalendarIcon />,
        isActive: true,
        items: [
          { title: "Upcoming", url: "#" },
          { title: "Past", url: "#" },
          { title: "Draft", url: "#" },
        ],
      },
      {
        title: "Exhibitors",
        url: "#",
        icon: <UsersIcon />,
        items: [
          { title: "All Exhibitors", url: "#" },
          { title: "Invitations", url: "#" },
          { title: "Applications", url: "#" },
        ],
      },
      {
        title: "Settings",
        url: "#",
        icon: <Settings2Icon />,
        items: [
          { title: "Profile", url: "#" },
          { title: "Billing", url: "#" },
        ],
      },
    ],
  },
  seller: {
    navMain: [
      {
        title: "My Booths",
        url: "#",
        icon: <BoxIcon />,
        isActive: true,
        items: [
          { title: "Active", url: "#" },
          { title: "Archived", url: "#" },
        ],
      },
      {
        title: "Events",
        url: "#",
        icon: <CalendarIcon />,
        items: [
          { title: "Browse", url: "#" },
          { title: "Registered", url: "#" },
        ],
      },
      {
        title: "Settings",
        url: "#",
        icon: <Settings2Icon />,
        items: [
          { title: "Profile", url: "#" },
          { title: "Billing", url: "#" },
        ],
      },
    ],
  },
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  portal?: PortalType
}

export function AppSidebar({ portal = "admin", ...props }: AppSidebarProps) {
  const { navMain, tradexpo } = navByPortal[portal]
  const activePortalName = portals.find((p) => p.url === `/${portal}`)?.name

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <PortalSwitcher portals={portals} activePortalName={activePortalName} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {tradexpo ? <NavTradeXpo projects={tradexpo} /> : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
