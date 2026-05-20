<script lang="ts">
import type { Snippet } from "svelte"
import AppSidebar from "$lib/components/app-sidebar.svelte"
import * as Sidebar from "$lib/components/ui/sidebar"
import type { PartnerAccess } from "$lib/partner/access"

interface Props {
  data: {
    partnerAccess: PartnerAccess
    user: {
      name: string
      email: string
      avatar: string
      roles: string[]
    }
  }
  children?: Snippet
}

let { data, children }: Props = $props()
</script>

<Sidebar.Provider>
  <AppSidebar
    portal="partner"
    partnerAccess={data.partnerAccess}
    user={data.user}
  />
  <Sidebar.Inset>
    {@render children?.()}
  </Sidebar.Inset>
</Sidebar.Provider>
