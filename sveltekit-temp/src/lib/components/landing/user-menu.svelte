<script lang="ts">
import {
  Bell,
  Heart,
  LayoutDashboard,
  ListChecks,
  MessageCircleMore,
  Settings,
  User as UserIcon
} from "lucide-svelte"
import { invalidateAll } from "$app/navigation"
import { Button } from "$lib/components/ui/button/index.js"
import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js"
import UserAvatar from "$lib/components/user-avatar.svelte"

let { user } = $props<{
  user: {
    id: string
    name: string
    email: string
    roles: string[]
  }
}>()

const handleLogout = async () => {
  await fetch("/api/auth/logout", { method: "POST" })
  invalidateAll()
  window.location.href = "/"
}

const getDashboardPath = () => {
  if (user.roles.includes("admin")) return "/admin"
  if (user.roles.includes("partner")) return "/partner"
  return "/seller"
}

const getNotificationPath = () => {
  if (user.roles.includes("admin")) return "/admin/notifications"
  if (user.roles.includes("partner")) return "/partner/notifications"
  return "/seller/notifications"
}
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" class="relative h-10 w-10 rounded-full p-0">
        <UserAvatar
          name={user.name}
          imageUrl="/avatar.webp"
          class="h-10 w-10"
        />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content
    class="w-64 rounded-2xl px-0 py-3"
    align="end"
  >
    <DropdownMenu.Item class="gap-2 rounded-none px-4 py-2.25">
      {#snippet child({ props })}
        <a href={getNotificationPath()} {...props} class="flex w-full items-center gap-2">
          <Bell size="18" strokeWidth="2" />
          <span class="font-medium">Notifications</span>
        </a>
      {/snippet}
    </DropdownMenu.Item>
    
    {#if !user.roles.includes("admin")}
      <DropdownMenu.Item class="gap-2 rounded-none px-4 py-2.25">
        {#snippet child({ props })}
          <a href="/seller/deal-room" {...props} class="flex w-full items-center gap-2">
            <MessageCircleMore size="18" strokeWidth="2" />
            <span class="font-medium">Deal Room</span>
          </a>
        {/snippet}
      </DropdownMenu.Item>
      <DropdownMenu.Item class="gap-2 rounded-none px-4 py-2.25">
        {#snippet child({ props })}
          <a href="/seller/deal-room" {...props} class="flex w-full items-center gap-2">
            <ListChecks size="18" strokeWidth="2" />
            <span class="font-medium">RFQ Hub</span>
          </a>
        {/snippet}
      </DropdownMenu.Item>
      <DropdownMenu.Item class="gap-2 rounded-none px-4 py-2.25">
        {#snippet child({ props })}
          <a href="/seller/deal-room" {...props} class="flex w-full items-center gap-2">
            <Heart size="18" strokeWidth="2" />
            <span class="font-medium">Wishlist</span>
          </a>
        {/snippet}
      </DropdownMenu.Item>
      <DropdownMenu.Item class="gap-2 rounded-none px-4 py-2.25">
        {#snippet child({ props })}
          <a href="/profile" {...props} class="flex w-full items-center gap-2">
            <UserIcon size="18" strokeWidth="2" />
            <span class="font-medium">Profile</span>
          </a>
        {/snippet}
      </DropdownMenu.Item>
    {/if}

    {#if user.roles.includes("partner")}
      <DropdownMenu.Separator />
      <DropdownMenu.Label class="pl-4">Portal</DropdownMenu.Label>
      <DropdownMenu.Item class="gap-2 rounded-none px-4 py-2.25">
        {#snippet child({ props })}
          <a href={getDashboardPath()} {...props} class="flex w-full items-center gap-2">
            <LayoutDashboard size="18" strokeWidth="2" />
            <span class="font-medium">Dashboard</span>
          </a>
        {/snippet}
      </DropdownMenu.Item>

      <DropdownMenu.Item class="gap-2 rounded-none px-4 py-2.25">
        {#snippet child({ props })}
          <a href="/partner/settings" {...props} class="flex w-full items-center gap-2">
            <Settings size="18" strokeWidth="2" />
            <span class="font-medium">Settings</span>
          </a>
        {/snippet}
      </DropdownMenu.Item>
    {/if}

    <DropdownMenu.Separator />
    <DropdownMenu.Item
      onclick={handleLogout}
      class="gap-2 rounded-none px-4 py-2.25 cursor-pointer"
    >
      <span class="font-normal">Log out</span>
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
