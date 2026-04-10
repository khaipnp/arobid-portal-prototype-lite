"use client"

import { ChevronsUpDownIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function PortalSwitcher({
  portals,
  activePortalName,
}: {
  portals: {
    name: string
    logo: React.ReactNode
    plan: string
    url: string
  }[]
  activePortalName?: string
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [activePortal, setActivePortal] = React.useState(
    portals.find((p) => p.name === activePortalName) ?? portals[0],
  )

  if (!activePortal) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {activePortal.logo}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activePortal.name}
                </span>
                <span className="truncate text-xs">{activePortal.plan}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Portals
            </DropdownMenuLabel>
            {portals.map((portal, index) => (
              <DropdownMenuItem
                key={portal.name}
                onClick={() => {
                  setActivePortal(portal)
                  router.push(portal.url)
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  {portal.logo}
                </div>
                {portal.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
