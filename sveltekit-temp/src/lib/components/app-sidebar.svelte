<script lang="ts">
import { Building2, Handshake, ShieldUser } from "lucide-svelte"
import type { Component } from "svelte"
import NavAdmin from "$lib/components/nav-admin.svelte"
import NavPartner from "$lib/components/nav-partner.svelte"
import NavSeller from "$lib/components/nav-seller.svelte"
import NavUser from "$lib/components/nav-user.svelte"
import PortalSwitcher from "$lib/components/portal-switcher.svelte"
import * as Sidebar from "$lib/components/ui/sidebar"
import type { PartnerAccess } from "$lib/partner/access"

export type PortalType = "admin" | "partner" | "seller"

const portals = [
  {
    name: "Admin Portal",
    logo: ShieldUser as unknown as Component,
    plan: "Admin View",
    url: "/admin"
  },
  {
    name: "Partner Portal",
    logo: Handshake as unknown as Component,
    plan: "Partner Workspace",
    url: "/partner"
  },
  {
    name: "Eg. Thaco Company",
    logo: Building2 as unknown as Component,
    plan: "User's Workspace",
    url: "/seller"
  }
]

interface Props {
  portal?: PortalType
  partnerAccess?: PartnerAccess
  user: {
    name: string
    email: string
    avatar: string
    roles?: string[]
  }
  class?: string
}

let {
  portal = "admin",
  partnerAccess,
  user,
  class: className = ""
}: Props = $props()

const activePortalName = $derived(
  portals.find((p) => p.url === `/${portal}`)?.name
)
const canSwitchPortals = $derived((user.roles ?? []).includes("sys_admin"))
const canManageSeller = $derived((user.roles ?? []).includes("seller"))
const canUseDealRoom = $derived(
  (user.roles ?? []).includes("seller") || (user.roles ?? []).includes("buyer")
)
</script>

<Sidebar.Root collapsible="icon" class={className}>
  <Sidebar.Header>
    <PortalSwitcher
      {portals}
      {activePortalName}
      {canSwitchPortals}
    />
  </Sidebar.Header>
  
  <Sidebar.Content>
    {#if portal === "admin"}
      <NavAdmin />
    {:else if portal === "partner"}
      <NavPartner access={partnerAccess} />
    {:else if portal === "seller"}
      <NavSeller
        {canManageSeller}
        {canUseDealRoom}
      />
    {/if}
  </Sidebar.Content>
  
  <Sidebar.Footer>
    <NavUser {user} />
  </Sidebar.Footer>
  
  <Sidebar.Rail />
</Sidebar.Root>
