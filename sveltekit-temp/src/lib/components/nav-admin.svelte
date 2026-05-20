<script lang="ts">
import {
  BrickWallShield,
  Grid3x2,
  History,
  LayoutDashboard,
  LayoutTemplate,
  MonitorPlay,
  PackageCheck,
  Receipt,
  Shapes,
  ShieldCheck,
  Ticket,
  ToyBrick,
  UserRoundKey,
  Users,
  WalletCards
} from "lucide-svelte"
import { page } from "$app/stores"
import * as Sidebar from "$lib/components/ui/sidebar"

const tradexpoLinks = [
  {
    name: "Overview",
    url: "/admin/tradexpo",
    icon: LayoutDashboard
  },
  {
    name: "Expo List",
    url: "/admin/tradexpo/expos",
    icon: Grid3x2
  },
  {
    name: "Hall Templates",
    url: "/admin/tradexpo/hall-templates",
    icon: LayoutTemplate
  },
  {
    name: "Booth Templates",
    url: "/admin/tradexpo/booth-templates",
    icon: ToyBrick
  }
]

const servicesLinks = [
  {
    name: "Host Dashboard",
    url: "/admin/streaming",
    icon: MonitorPlay
  },
  {
    name: "Order Management",
    url: "/admin/orders",
    icon: Receipt
  },
  {
    name: "eVoucher",
    url: "/admin/evoucher",
    icon: Ticket
  },
  {
    name: "TradeCredit",
    url: "/admin/tradecredit",
    icon: WalletCards
  },
  {
    name: "Plan Packages",
    url: "/admin/plan-subscriptions/packages",
    icon: PackageCheck
  },
  {
    name: "Payment Management",
    url: "/admin/settings/payment-management",
    icon: WalletCards
  }
]

const administrationLinks = [
  {
    name: "Partner Audit",
    url: "/admin/partners/association-audit",
    icon: History
  },
  {
    name: "Users",
    url: "/admin/administration/users",
    icon: Users
  },
  {
    name: "Modules",
    url: "/admin/administration/modules",
    icon: ShieldCheck
  },
  {
    name: "Roles",
    url: "/admin/administration/roles",
    icon: UserRoundKey
  },
  {
    name: "Features",
    url: "/admin/administration/features",
    icon: Shapes
  },
  {
    name: "Permissions",
    url: "/admin/administration/permissions",
    icon: BrickWallShield
  }
]
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
  <Sidebar.GroupLabel class="select-none">TradeXpo</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each tradexpoLinks as item}
      {@const Icon = item.icon}
      {@const isActive = $page.url.pathname === item.url}
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
</Sidebar.Group>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
  <Sidebar.GroupLabel class="select-none">Service Management</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each servicesLinks as item}
      {@const Icon = item.icon}
      {@const isActive = $page.url.pathname === item.url}
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
</Sidebar.Group>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
  <Sidebar.GroupLabel class="select-none">Administration</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each administrationLinks as item}
      {@const Icon = item.icon}
      {@const isActive = $page.url.pathname === item.url}
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
</Sidebar.Group>
