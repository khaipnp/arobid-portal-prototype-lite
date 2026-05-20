<script lang="ts">
import { Bell } from "lucide-svelte"
import { onDestroy, onMount } from "svelte"
import { page } from "$app/stores"
import { Badge } from "$lib/components/ui/badge"
import * as Sidebar from "$lib/components/ui/sidebar"

interface Props {
  href: string
}

let { href }: Props = $props()

let unreadCount = $state(0)
let timer: number | null = null

const hasUnread = $derived(unreadCount > 0)
const isActive = $derived($page.url.pathname === href)

async function fetchUnreadCount() {
  try {
    const response = await fetch(`/api/notifications/unread-count`, {
      cache: "no-store"
    })
    if (response.ok) {
      const payload = await response.json()
      unreadCount = payload.unreadCount || 0
    }
  } catch {
    // Keep last known unread count; polling will retry.
  }
}

onMount(() => {
  fetchUnreadCount()
  timer = window.setInterval(fetchUnreadCount, 10_000)
})

onDestroy(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<Sidebar.MenuItem>
  <Sidebar.MenuButton isActive={isActive}>
    <a href={href} class="flex w-full items-center gap-2">
      <div class="relative flex items-center justify-center">
        <Bell class="size-4" />
        {#if hasUnread}
          <span class="absolute -top-1 -right-1 size-2 rounded-full bg-primary">
            <span class="sr-only">Unread notifications</span>
          </span>
        {/if}
      </div>
      <span>Notifications</span>
      {#if hasUnread}
        <Badge class="ml-auto h-4 px-1.5" aria-live="polite">
          {unreadCount}
        </Badge>
      {/if}
    </a>
  </Sidebar.MenuButton>
</Sidebar.MenuItem>
