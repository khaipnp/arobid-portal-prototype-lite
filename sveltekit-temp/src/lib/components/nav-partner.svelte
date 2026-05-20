<script lang="ts">
import {
  Aperture,
  LayoutDashboard,
  Palette,
  PieChart,
  UserCog,
  Users,
  WalletCards
} from "lucide-svelte"
import { page } from "$app/stores"
import NotificationNavLink from "$lib/components/notifications/notification-nav-link.svelte"
import * as Sidebar from "$lib/components/ui/sidebar"
import type { PartnerAccess } from "$lib/partner/access"
import type { PartnerModule } from "$lib/partner/core"

interface NavItem {
  name: string
  url: string
  module: PartnerModule
  icon: any
}

interface Props {
  access?: PartnerAccess
}

let { access }: Props = $props()

const activityLinks = [
  {
    name: "Expo Programs",
    url: "/partner/expos",
    module: "expo_programs",
    icon: Aperture
  },
  {
    name: "TradeCredit Reports",
    url: "/partner/tradecredit",
    module: "tradecredit_reports",
    icon: WalletCards
  },
  {
    name: "Analytics",
    url: "/partner/analytics",
    module: "analytics_reports",
    icon: PieChart
  }
] satisfies NavItem[]

const configurationLinks = [
  {
    name: "User Management",
    url: "/partner/users",
    module: "overview",
    icon: UserCog
  },
  {
    name: "Mini-site",
    url: "/partner/site-management",
    module: "mini_site",
    icon: Palette
  },
  {
    name: "Members",
    url: "/partner/enterprises",
    module: "enterprises",
    icon: Users
  }
] satisfies NavItem[]

const showDashboard = $derived(access?.modules.overview ?? false)
const visibleActivityLinks = $derived(
  activityLinks.filter((item) => access?.modules[item.module] ?? false)
)
const visibleConfigurationLinks = $derived(
  configurationLinks.filter((item) => access?.modules[item.module] ?? false)
)
</script>

<Sidebar.Group>
  <Sidebar.GroupLabel class="select-none">Activity</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#if showDashboard}
      {@const isActive = $page.url.pathname === "/partner"}
      <Sidebar.MenuItem>
        <Sidebar.MenuButton isActive={isActive}>
          <a href="/partner" class="flex w-full items-center gap-2">
            <LayoutDashboard class="size-4" />
            <span>Dashboard</span>
          </a>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    {/if}
  </Sidebar.Menu>
  
  <Sidebar.Menu>
    <NotificationNavLink href="/partner/notifications" />
  </Sidebar.Menu>

  <Sidebar.Menu>
    {#each visibleActivityLinks as item}
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

  {#if visibleConfigurationLinks.length > 0}
    <Sidebar.GroupLabel class="select-none">Configurations</Sidebar.GroupLabel>
    <Sidebar.Menu>
      {#each visibleConfigurationLinks as item}
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
  {/if}
</Sidebar.Group>
