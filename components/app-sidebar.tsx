"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavTradeXpo } from "./nav-tradexpo"
import { NavUser } from "@/components/nav-user"
import { PortalSwitcher } from "@/components/portal-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, TerminalSquareIcon, BotIcon, BookOpenIcon, Settings2Icon, FrameIcon, PieChartIcon, LayoutPanelTopIcon } from "lucide-react"


// This is sample data.
const data = {
  user: {
    name: "Khai Pham",
    email: "khaipham@arobid.com",
    avatar: "/avatar.webp",
  },
  portals: [
    {
      name: "Admin Portal",
      logo: (
        <GalleryVerticalEndIcon
        />
      ),
      plan: "Admin View",
    },
    {
      name: "Partner Portal",
      logo: (
        <AudioLinesIcon
        />
      ),
      plan: "Expo Owner View",
    },
    {
      name: "Supplier Portal",
      logo: (
        <TerminalIcon
        />
      ),
      plan: "Supplier View",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: (
        <TerminalSquareIcon
        />
      ),
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: (
        <BotIcon
        />
      ),
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: (
        <BookOpenIcon
        />
      ),
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: (
        <Settings2Icon
        />
      ),
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  tradexpo: [
    {
      name: "Hall Templates",
      url: "/dashboard/tradexpo/hall-templates",
      icon: (
        <PieChartIcon
        />
      ),
    },
    {
      name: "Booth Templates",
      url: "/dashboard/tradexpo/booth-templates",
      icon: (
        <LayoutPanelTopIcon
        />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <PortalSwitcher portals={data.portals} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavTradeXpo projects={data.tradexpo} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
