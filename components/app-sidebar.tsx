"use client"

import { Building2Icon, HandshakeIcon, ShieldUserIcon } from "lucide-react"
import type * as React from "react"
import { NavAdmin } from "@/components/nav-admin"
import { NavPartner } from "@/components/nav-partner"
import { NavSeller } from "@/components/nav-seller"
import { NavUser } from "@/components/nav-user"
import { PortalSwitcher } from "@/components/portal-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar"

export type PortalType = "admin" | "partner" | "seller"

const portals = [
  {
    name: "Admin Portal",
    logo: <ShieldUserIcon />,
    plan: "Admin View",
    url: "/admin"
  },
  {
    name: "Partner Portal",
    logo: <HandshakeIcon />,
    plan: "Expo Owner View",
    url: "/partner"
  },
  {
    name: "Eg. Thaco Company",
    logo: <Building2Icon />,
    plan: "User's Workspace",
    url: "/seller"
  }
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  portal?: PortalType
  user: {
    name: string
    email: string
    avatar: string
    roles?: string[]
  }
}

export function AppSidebar({
  portal = "admin",
  user,
  ...props
}: AppSidebarProps) {
  const activePortalName = portals.find((p) => p.url === `/${portal}`)?.name
  const canSwitchPortals = (user.roles ?? []).includes("sys_admin")
  const canManageSeller = (user.roles ?? []).includes("seller")
  const canUseDealRoom =
    (user.roles ?? []).includes("seller") || (user.roles ?? []).includes("buyer")

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <PortalSwitcher
          portals={portals}
          activePortalName={activePortalName}
          canSwitchPortals={canSwitchPortals}
        />
      </SidebarHeader>
      <SidebarContent>
        {portal === "admin" && <NavAdmin />}
        {portal === "partner" && <NavPartner />}
        {portal === "seller" && (
          <NavSeller
            canManageSeller={canManageSeller}
            canUseDealRoom={canUseDealRoom}
          />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
