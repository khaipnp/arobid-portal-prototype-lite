<script lang="ts">
import {
  Dot,
  Heart,
  LayoutDashboard,
  MessageCircle,
  ReceiptText,
  ShoppingCart,
  TvMinimal,
  WalletCards
} from "lucide-svelte"
import { page } from "$app/stores"
import NotificationNavLink from "$lib/components/notifications/notification-nav-link.svelte"
import * as Sidebar from "$lib/components/ui/sidebar"
import * as Tooltip from "$lib/components/ui/tooltip"

interface Props {
  canManageSeller: boolean
  canUseDealRoom: boolean
}

let { canManageSeller, canUseDealRoom }: Props = $props()

const seller = [
  {
    name: "Legal Information",
    url: "/seller/b2b-marketplace",
    icon: Dot
  },
  {
    name: "Company Profile",
    url: "/seller/product-management",
    icon: Dot
  },
  {
    name: "eProfile",
    url: "/seller/eprofile",
    icon: Dot
  },
  {
    name: "Product Management",
    url: "/seller/product-management",
    icon: Dot
  },
  {
    name: "My Quotations",
    url: "/seller/my-quotations",
    icon: Dot
  }
]

const buyer = [
  {
    name: "My RFQs",
    url: "/seller/my-rfqs",
    icon: Dot
  }
]
</script>

<Sidebar.Group>
  <Sidebar.Menu>
    {@const isActive = ($page.url.pathname as string) === "/seller"}
    <Sidebar.MenuItem>
      <Sidebar.MenuButton isActive={isActive}>
        <a href="/seller" class="flex w-full items-center gap-2">
          <LayoutDashboard class="size-4" />
          <span>Dashboard</span>
        </a>
      </Sidebar.MenuButton>
    </Sidebar.MenuItem>
  </Sidebar.Menu>

  <Sidebar.Menu>
    <NotificationNavLink href="/seller/notifications" />
  </Sidebar.Menu>

  {#if canUseDealRoom}
    <Sidebar.Menu>
      {@const isActive = ($page.url.pathname as string) === "/seller/deal-room"}
      <Sidebar.MenuItem>
        <Sidebar.MenuButton isActive={isActive}>
          <a href="/seller/deal-room" class="flex w-full items-center gap-2">
            <MessageCircle class="size-4" />
            <span>Deal Room</span>
          </a>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  {/if}

  <Sidebar.Menu>
    {@const isActive = ($page.url.pathname as string) === "/seller/wishlist"}
    <Sidebar.MenuItem>
      <Sidebar.MenuButton isActive={isActive}>
        <a href="/seller/wishlist" class="flex w-full items-center gap-2">
          <Heart class="size-4" />
          <span>Wishlist</span>
        </a>
      </Sidebar.MenuButton>
    </Sidebar.MenuItem>
  </Sidebar.Menu>

  {#if canManageSeller}
    <Sidebar.Menu>
      {@const isActive = ($page.url.pathname as string) === "/seller/my-expos"}
      <Sidebar.MenuItem>
        <Sidebar.MenuButton isActive={isActive}>
          <a href="/seller/my-expos" class="flex w-full items-center gap-2">
            <TvMinimal class="size-4" />
            <span>My Expos</span>
          </a>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  {/if}

  <Sidebar.Menu>
    {@const isActive = ($page.url.pathname as string) === "/seller/orders"}
    <Sidebar.MenuItem>
      <Sidebar.MenuButton isActive={isActive}>
        <a href="/seller/orders" class="flex w-full items-center gap-2">
          <ReceiptText class="size-4" />
          <span>Orders</span>
        </a>
      </Sidebar.MenuButton>
    </Sidebar.MenuItem>
  </Sidebar.Menu>

  <Sidebar.Menu>
    {@const isActive = ($page.url.pathname as string) === "/seller/tradecredit"}
    <Sidebar.MenuItem>
      <Sidebar.MenuButton isActive={isActive}>
        <a href="/seller/tradecredit" class="flex w-full items-center gap-2">
          <WalletCards class="size-4" />
          <span>TradeCredit</span>
        </a>
      </Sidebar.MenuButton>
    </Sidebar.MenuItem>
  </Sidebar.Menu>

  {#if canManageSeller}
    <Sidebar.GroupLabel class="select-none">Seller</Sidebar.GroupLabel>
    <Sidebar.Menu>
      {#each seller as item}
        {@const Icon = item.icon}
        {@const isActive = ($page.url.pathname as string) === item.url}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton isActive={isActive}>
            <a href={item.url} class="flex w-full items-center gap-2">
              <Icon class="size-4 animate-pulse" />
              <span>{item.name}</span>
            </a>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      {/each}
    </Sidebar.Menu>
  {/if}

  <Sidebar.GroupLabel class="select-none">Buyer</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each buyer as item}
      {@const Icon = item.icon}
      {@const isActive = ($page.url.pathname as string) === item.url}
      <Sidebar.MenuItem>
        <Sidebar.MenuButton isActive={isActive}>
          <a href={item.url} class="flex w-full items-center gap-2">
            <Icon class="size-4" />
            <span>{item.name}</span>
          </a>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    {/each}
  </Sidebar.Menu>

  {#if canManageSeller}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger class="w-full text-left">
          <Sidebar.GroupLabel class="cursor-help underline select-none">
            Demo
          </Sidebar.GroupLabel>
        </Tooltip.Trigger>
        <Tooltip.Content align="start" class="text-sm max-w-xs">
          <p><span class="font-bold">PO Note:</span> Chỉ dùng cho mục đích demo không cần coding</p>
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
    
    <Sidebar.Menu>
      {@const isActive = ($page.url.pathname as string) === "/seller/checkout-demo"}
      <Sidebar.MenuItem>
        <Sidebar.MenuButton isActive={isActive}>
          <a href="/seller/checkout-demo" class="flex w-full items-center gap-2">
            <ShoppingCart class="size-4" />
            <span>Checkout Demo (eVoucher)</span>
          </a>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  {/if}
</Sidebar.Group>
