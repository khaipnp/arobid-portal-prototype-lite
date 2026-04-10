"use client";

import {
  AudioLinesIcon,
  BookOpenIcon,
  BotIcon,
  GalleryVerticalEndIcon,
  LayoutPanelTopIcon,
  PieChartIcon,
  Settings2Icon,
  TerminalIcon,
  TerminalSquareIcon,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { PortalSwitcher } from "@/components/portal-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavTradeXpo } from "./nav-tradexpo";

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
      logo: <GalleryVerticalEndIcon />,
      plan: "Admin View",
    },
    {
      name: "Partner Portal",
      logo: <AudioLinesIcon />,
      plan: "Expo Owner View",
    },
    {
      name: "Supplier Portal",
      logo: <TerminalIcon />,
      plan: "Supplier View",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: <TerminalSquareIcon />,
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
      icon: <BotIcon />,
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
      icon: <BookOpenIcon />,
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
      icon: <Settings2Icon />,
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
      url: "/admin/tradexpo/hall-templates",
      icon: <PieChartIcon />,
    },
    {
      name: "Booth Templates",
      url: "/admin/tradexpo/booth-templates",
      icon: <LayoutPanelTopIcon />,
    },
  ],
};

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
  );
}
