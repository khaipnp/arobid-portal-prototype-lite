"use client"

import {
  CalendarIcon,
  ChevronRightIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

const nav = [
  {
    title: "My Events",
    url: "#",
    icon: <CalendarIcon />,
    isActive: true,
    items: [
      { title: "Upcoming", url: "#" },
      { title: "Past", url: "#" },
      { title: "Draft", url: "#" },
    ],
  },
  {
    title: "Exhibitors",
    url: "#",
    icon: <UsersIcon />,
    items: [
      { title: "All Exhibitors", url: "#" },
      { title: "Invitations", url: "#" },
      { title: "Applications", url: "#" },
    ],
  },
  {
    title: "Settings",
    url: "#",
    icon: <Settings2Icon />,
    items: [
      { title: "Profile", url: "#" },
      { title: "Billing", url: "#" },
    ],
  },
]

export function NavPartner() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Expo Owner</SidebarGroupLabel>
      <SidebarMenu>
        {nav.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon}
                  <span>{item.title}</span>
                  <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((sub) => (
                    <SidebarMenuSubItem key={sub.title}>
                      <SidebarMenuSubButton asChild>
                        <a href={sub.url}>{sub.title}</a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
