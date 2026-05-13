"use client"

import {
  DotIcon,
  LayoutDashboardIcon,
  MessageCircleIcon,
  ReceiptTextIcon,
  ShoppingCartIcon,
  TvMinimalIcon
} from "lucide-react"
import Link from "next/link"
import { NotificationNavLink } from "@/components/notifications/notification-nav-link"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card"

const seller = [
  {
    name: "Legal Information",
    url: "/seller/b2b-marketplace",
    icon: <DotIcon />
  },
  {
    name: "Company Profile",
    url: "/seller/product-management",
    icon: <DotIcon />
  },
  {
    name: "eProfile",
    url: "/seller/eprofile",
    icon: <DotIcon />
  },
  {
    name: "Product Management",
    url: "/seller/product-management",
    icon: <DotIcon />
  },
  {
    name: "My Quotations",
    url: "/seller/my-quotations",
    icon: <DotIcon />
  }
]

const buyer = [
  {
    name: "My RFQs",
    url: "/seller/my-rfqs",
    icon: <DotIcon />
  }
]

export function NavSeller({
  canManageSeller,
  canUseDealRoom
}: {
  canManageSeller: boolean
  canUseDealRoom: boolean
}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuButton asChild>
          <Link href="/seller">
            <LayoutDashboardIcon />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenu>
      <SidebarMenu>
        <NotificationNavLink href="/seller/notifications" />
      </SidebarMenu>

      {canUseDealRoom ? (
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/seller/deal-room">
                <MessageCircleIcon />
                <span>Deal Room</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      ) : null}

      {canManageSeller ? (
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/seller/my-expos">
                <TvMinimalIcon />
                <span>My Expos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      ) : null}

      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/seller/orders">
              <ReceiptTextIcon />
              <span>Orders</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      {canManageSeller ? (
        <>
          <SidebarGroupLabel className="select-none">Seller</SidebarGroupLabel>
          <SidebarMenu>
            {seller.map((item) => (
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

      <SidebarGroupLabel className="select-none">Buyer</SidebarGroupLabel>
      <SidebarMenu>
        {buyer.map((item) => (
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

      {canManageSeller ? (
        <>
          <HoverCard>
            <HoverCardTrigger asChild>
              <SidebarGroupLabel className="cursor-help underline">
                Demo
              </SidebarGroupLabel>
            </HoverCardTrigger>
            <HoverCardContent align="start" className="text-sm">
              <span className="font-bold">PO Note: &nbsp;</span>
              <span>Chỉ dùng cho mục đích demo không cần coding</span>
            </HoverCardContent>
          </HoverCard>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/seller/checkout-demo">
                <ShoppingCartIcon />
                <span>Checkout Demo (eVoucher)</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </>
      ) : null}
    </SidebarGroup>
  )
}
