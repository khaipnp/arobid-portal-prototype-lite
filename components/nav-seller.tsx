"use client"

import {
  DotIcon,
  HeartIcon,
  LayoutDashboardIcon,
  MessageCircleIcon,
  ReceiptTextIcon,
  ShoppingCartIcon,
  TvMinimalIcon,
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
  SidebarMenuItem
} from "@/components/ui/sidebar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card"

const seller = [
  {
    name: "B2B Marketplace",
    url: "/marketplace",
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

function isActiveItem(
  pathname: string,
  href: string,
  activeKey: string | undefined,
  itemKey = href
) {
  return (
    activeKey === itemKey &&
    (pathname === href || pathname.startsWith(`${href}/`))
  )
}

export function NavSeller({
  canManageSeller,
  canUseDealRoom
}: {
  canManageSeller: boolean
  canUseDealRoom: boolean
}) {
  const pathname = usePathname()
  const primaryLinks = [
    { key: "/seller", url: "/seller" },
    ...(canUseDealRoom
      ? [{ key: "/seller/deal-room", url: "/seller/deal-room" }]
      : []),
    { key: "/seller/wishlist", url: "/seller/wishlist" },
    ...(canManageSeller
      ? [{ key: "/seller/my-expos", url: "/seller/my-expos" }]
      : []),
    { key: "/seller/orders", url: "/seller/orders" },
    { key: "/seller/tradecredit", url: "/seller/tradecredit" }
  ]
  const activeLinks = [
    ...primaryLinks,
    { key: "/seller/notifications", url: "/seller/notifications" },
    ...(canManageSeller
      ? seller.map((item) => ({ key: item.name, url: item.url }))
      : []),
    ...buyer.map((item) => ({ key: item.url, url: item.url })),
    ...(canManageSeller
      ? [{ key: "/seller/checkout-demo", url: "/seller/checkout-demo" }]
      : [])
  ]
  const activeKey = activeLinks
    .map((item, index) => ({ ...item, index }))
    .filter(
      (item) => pathname === item.url || pathname.startsWith(`${item.url}/`)
    )
    .sort((a, b) => b.url.length - a.url.length || b.index - a.index)[0]?.key

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuButton
          asChild
          isActive={isActiveItem(pathname, "/seller", activeKey)}
        >
          <Link
            href="/seller"
            aria-current={
              isActiveItem(pathname, "/seller", activeKey) ? "page" : undefined
            }
          >
            <LayoutDashboardIcon />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenu>

      {canUseDealRoom ? (
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActiveItem(pathname, "/seller/deal-room", activeKey)}
            >
              <Link
                href="/seller/deal-room"
                aria-current={
                  isActiveItem(pathname, "/seller/deal-room", activeKey)
                    ? "page"
                    : undefined
                }
              >
                <MessageCircleIcon />
                <span>Deal Room</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      ) : null}

      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isActiveItem(pathname, "/seller/wishlist", activeKey)}
          >
            <Link
              href="/seller/wishlist"
              aria-current={
                isActiveItem(pathname, "/seller/wishlist", activeKey)
                  ? "page"
                  : undefined
              }
            >
              <HeartIcon />
              <span>Wishlist</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      {canManageSeller ? (
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActiveItem(pathname, "/seller/my-expos", activeKey)}
            >
              <Link
                href="/seller/my-expos"
                aria-current={
                  isActiveItem(pathname, "/seller/my-expos", activeKey)
                    ? "page"
                    : undefined
                }
              >
                <TvMinimalIcon />
                <span>My Expos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      ) : null}

      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isActiveItem(pathname, "/seller/orders", activeKey)}
          >
            <Link
              href="/seller/orders"
              aria-current={
                isActiveItem(pathname, "/seller/orders", activeKey)
                  ? "page"
                  : undefined
              }
            >
              <ReceiptTextIcon />
              <span>Orders</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isActiveItem(pathname, "/seller/tradecredit", activeKey)}
          >
            <Link
              href="/seller/tradecredit"
              aria-current={
                isActiveItem(pathname, "/seller/tradecredit", activeKey)
                  ? "page"
                  : undefined
              }
            >
              <WalletCardsIcon />
              <span>TradeCredit</span>
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
                <SidebarMenuButton
                  asChild
                  isActive={isActiveItem(
                    pathname,
                    item.url,
                    activeKey,
                    item.name
                  )}
                >
                  <Link
                    href={item.url}
                    aria-current={
                      isActiveItem(pathname, item.url, activeKey, item.name)
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

      <SidebarGroupLabel className="select-none">Buyer</SidebarGroupLabel>
      <SidebarMenu>
        {buyer.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              isActive={isActiveItem(pathname, item.url, activeKey)}
            >
              <Link
                href={item.url}
                aria-current={
                  isActiveItem(pathname, item.url, activeKey)
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
  )
}
