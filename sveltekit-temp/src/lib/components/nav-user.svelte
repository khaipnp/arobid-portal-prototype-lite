<script lang="ts">
import { Bell, ChevronsUpDown, LogOut, UserCircle } from "lucide-svelte"
import { goto } from "$app/navigation"
import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
import * as Sidebar from "$lib/components/ui/sidebar"
import { useSidebar } from "$lib/components/ui/sidebar"
import UserAvatar from "$lib/components/user-avatar.svelte"

interface Props {
  user: {
    name: string
    email: string
    avatar: string
  }
}

let { user }: Props = $props()
const sidebar = useSidebar()

async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST" })
  goto("/login", { replaceState: true })
}
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            {...props}
          >
            <UserAvatar
              name={user.name}
              imageUrl={user.avatar}
              class="h-8 w-8 rounded-lg"
              fallbackClassName="rounded-lg"
            />
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{user.name}</span>
              <span class="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-[--bits-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-background"
        side={sidebar.isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenu.Label class="p-0 font-normal">
          <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <UserAvatar name={user.name} imageUrl={user.avatar} />
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium text-foreground">
                {user.name}
              </span>
              <span class="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Group>
          <DropdownMenu.Item>
            <UserCircle class="size-4 mr-2" />
            <span>Account</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item>
            <a
              href="/seller/notifications"
              class="flex w-full items-center"
            >
              <Bell class="size-4 mr-2" />
              <span>Notifications</span>
            </a>
          </DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={handleLogout}>
          <LogOut class="size-4 mr-2" />
          <span>Log out</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>
