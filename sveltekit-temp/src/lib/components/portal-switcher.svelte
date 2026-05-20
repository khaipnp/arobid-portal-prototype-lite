<script lang="ts">
import { ChevronsUpDown } from "lucide-svelte"
import type { Component } from "svelte"
import { goto } from "$app/navigation"
import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
import * as Sidebar from "$lib/components/ui/sidebar"
import { useSidebar } from "$lib/components/ui/sidebar"
import * as Tooltip from "$lib/components/ui/tooltip"

interface Portal {
  name: string
  logo: Component
  plan: string
  url: string
}

interface Props {
  portals: Portal[]
  activePortalName?: string
  canSwitchPortals?: boolean
}

let { portals, activePortalName, canSwitchPortals = false }: Props = $props()

const sidebar = useSidebar()

let activePortal = $state(
  portals.find((p) => p.name === activePortalName) ?? portals[0]
)

function handlePortalSelect(portal: Portal) {
  activePortal = portal
  goto(portal.url)
}

function handleKeyDown(event: KeyboardEvent) {
  if (!canSwitchPortals) return

  if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
    return
  }

  const target = event.target
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT")
  ) {
    return
  }

  const shortcutIndex = Number.parseInt(event.key, 10) - 1
  const selectedPortal = portals[shortcutIndex]

  if (!selectedPortal) return

  event.preventDefault()
  handlePortalSelect(selectedPortal)
}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#snippet logoIcon(logo: Component, size: string)}
  {@const Logo = logo}
  <Logo class={size} />
{/snippet}

{#if activePortal}
  <Sidebar.Menu>
    <Sidebar.MenuItem>
      {#if !canSwitchPortals}
        <Sidebar.MenuButton size="lg" class="cursor-default">
          <div class="flex aspect-square size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            {@render logoIcon(activePortal.logo, "size-4")}
          </div>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-medium">{activePortal.name}</span>
            <span class="truncate text-xs">{activePortal.plan}</span>
          </div>
        </Sidebar.MenuButton>
      {:else}
        <DropdownMenu.Root>
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger class="w-full text-left">
                <DropdownMenu.Trigger>
                  {#snippet child({ props })}
                    <Sidebar.MenuButton
                      size="lg"
                      class="cursor-help data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full"
                      {...props}
                    >
                      <div class="flex aspect-square size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                        {@render logoIcon(activePortal.logo, "size-4")}
                      </div>
                      <div class="grid flex-1 text-left text-sm leading-tight">
                        <span class="truncate font-medium">
                          {activePortal.name}
                        </span>
                        <span class="truncate text-xs">
                          {activePortal.plan}
                        </span>
                      </div>
                      <ChevronsUpDown class="ml-auto size-4" />
                    </Sidebar.MenuButton>
                  {/snippet}
                </DropdownMenu.Trigger>
              </Tooltip.Trigger>
              <Tooltip.Content align="start" class="text-sm max-w-xs">
                <p><span class="font-bold">PO Note:</span> Đây là action dành cho prototype. Không dùng trong production.</p>
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
          <DropdownMenu.Content
            class="w-[--bits-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-background"
            align="start"
            side={sidebar.isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {#each portals as portal, index}
              <DropdownMenu.Item
                onclick={() => handlePortalSelect(portal)}
                class="gap-2 p-2"
              >
                <div class="flex size-6 items-center justify-center rounded-md border bg-muted">
                  {@render logoIcon(portal.logo, "size-3")}
                </div>
                <span>{portal.name}</span>
                <DropdownMenu.Shortcut>⌘{index + 1}</DropdownMenu.Shortcut>
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    </Sidebar.MenuItem>
  </Sidebar.Menu>
{/if}
