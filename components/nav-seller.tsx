"use client"

import {
  DotIcon,
  ExternalLinkIcon,
  MessageCircleIcon,
  ShoppingCartIcon,
} from "lucide-react"
import Link from "next/link"
import { NotificationNavLink } from "@/components/notifications/notification-nav-link"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card"

const tradexpo = [
  {
    name: "Overview",
    url: "/seller/overview",
    icon: <DotIcon />,
  },
  {
    name: "My Expos",
    url: "/seller/my-expos",
    icon: <DotIcon />,
    note: "Danh sách các expo mà user đã và đang tham gia.",
  },
]

const seller = [
  {
    name: "Legal Information",
    url: "/seller/b2b-marketplace",
    icon: <DotIcon />,
  },
  {
    name: "Company Profile",
    url: "/seller/product-management",
    icon: <DotIcon />,
  },
  {
    name: "eProfile",
    url: "/seller/eprofile",
    icon: <DotIcon />,
  },
  {
    name: "Product Management",
    url: "/seller/product-management",
    icon: <DotIcon />,
  },
  {
    name: "My Quotations",
    url: "/seller/my-quotations",
    icon: <DotIcon />,
  },
]

const buyer = [
  {
    name: "My RFQs",
    url: "/seller/my-rfqs",
    icon: <DotIcon />,
  },
]

const quickLinks = [
  {
    name: "RFQ Hub",
    url: "/seller/rfq-hub",
    icon: <ExternalLinkIcon />,
  },
  {
    name: "eProfile",
    url: "/seller/rfq-hub",
    icon: <ExternalLinkIcon />,
  },
]

export function NavSeller() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        <NotificationNavLink userId="seller-1" href="/seller/notifications" />
      </SidebarMenu>

      {/* Deal Room */}
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
      <SidebarMenu>{/* TradeXpo */}</SidebarMenu>
      <SidebarGroupLabel>TradeXpo</SidebarGroupLabel>
      <SidebarMenu>
        {tradexpo.map((item) => (
          <SidebarMenuItem key={item.name}>
            <HoverCard>
              <HoverCardTrigger asChild>
                <SidebarMenuButton asChild>
                  <Link
                    href={item.url}
                    className={cn(item.note && "cursor-help underline")}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </HoverCardTrigger>
              {item.note && (
                <HoverCardContent align="start" className="text-sm">
                  <span className="font-bold">PO Note: &nbsp;</span>
                  <span>{item.note}</span>
                </HoverCardContent>
              )}
            </HoverCard>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      {/* Seller */}
      <SidebarGroupLabel>Seller</SidebarGroupLabel>
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

      {/* Buyer */}
      <SidebarGroupLabel>Buyer</SidebarGroupLabel>
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
      {/* Quick Links */}
      <HoverCard>
        <HoverCardTrigger asChild>
          <SidebarGroupLabel className="cursor-help underline">
            Quick Links
          </SidebarGroupLabel>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="text-sm">
          <span className="font-bold">PO Note: &nbsp;</span>
          <span>
            Các quick links khi click vào sẽ mở tab mới dẫn đến các trang liên
            quan.
          </span>
        </HoverCardContent>
      </HoverCard>
      <SidebarMenu>
        {quickLinks.map((item) => (
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

      {/* Demo */}
      <SidebarGroupLabel>Demo</SidebarGroupLabel>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/seller/checkout-demo">
            <ShoppingCartIcon />
            <span>Checkout Demo (eVoucher)</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarGroup>
  )
}
