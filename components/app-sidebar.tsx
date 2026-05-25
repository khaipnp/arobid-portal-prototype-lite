"use client";

import Image from "next/image";
import type * as React from "react";
import { NavAdmin } from "@/components/nav-admin";
import { NavPartner } from "@/components/nav-partner";
import { NavSeller } from "@/components/nav-seller";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { PartnerAccess } from "@/lib/partner/access";

export type PortalType = "admin" | "partner" | "seller";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  portal?: PortalType;
  partnerAccess?: PartnerAccess;
  user: {
    name: string;
    email: string;
    avatar: string;
    roles?: string[];
  };
}

export function AppSidebar({
  portal = "admin",
  partnerAccess,
  user,
  ...props
}: AppSidebarProps) {
  const canManageSeller = (user.roles ?? []).includes("seller");
  const canUseDealRoom =
    (user.roles ?? []).includes("seller") ||
    (user.roles ?? []).includes("buyer");

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="items-center py-2">
        <Image
          src="/assets/images/arobid-logo-light-mode.svg"
          alt="Arobid Logo"
          width={180}
          height={192}
          className="group-data-[collapsible=icon]:hidden"
        />
        <Image
          src="/assets/images/arobid-logo-icon.webp"
          alt="Arobid Logo"
          width={48}
          height={48}
          className="hidden group-data-[collapsible=icon]:block"
        />
      </SidebarHeader>
      <SidebarContent>
        {portal === "admin" && <NavAdmin />}
        {portal === "partner" && <NavPartner access={partnerAccess} />}
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
  );
}
