"use client"

import {
  BellIcon,
  ChevronRightIcon,
  LanguagesIcon,
  LogOutIcon,
  UserCircleIcon
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { AccountProfileDialog } from "@/components/account/account-profile-dialog"
import { NotificationTrigger } from "@/components/notifications/notification-trigger"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"
import { UserAvatar } from "@/components/user-avatar"
import { cn } from "@/lib/utils"

export function NavUser({
  user
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [accountOpen, setAccountOpen] = React.useState(false)
  const [languageOpen, setLanguageOpen] = React.useState(false)
  const [selectedLanguage, setSelectedLanguage] = React.useState("English")
  const [selectedCurrency, setSelectedCurrency] = React.useState("USD")

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.replace("/login")
    router.refresh()
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <UserAvatar name={user.name} imageUrl={user.avatar} size="lg" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronRightIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-background"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <UserAvatar name={user.name} imageUrl={user.avatar} />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium text-foreground">
                      {user.name}
                    </span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault()
                    setAccountOpen(true)
                  }}
                >
                  <UserCircleIcon />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  onSelect={(event) => {
                    event.preventDefault()
                  }}
                >
                  <NotificationTrigger
                    className="h-auto w-full justify-start rounded-md px-1.5 py-1 font-normal"
                    size="sm"
                    variant="ghost"
                  >
                    <BellIcon />
                    Notifications
                  </NotificationTrigger>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault()
                    setLanguageOpen(true)
                  }}
                >
                  <LanguagesIcon />
                  Language
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <AccountProfileDialog open={accountOpen} onOpenChange={setAccountOpen} />
      <Dialog open={languageOpen} onOpenChange={setLanguageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Language</DialogTitle>
            <DialogDescription>
              Choose the language you want to use.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6">
            <section className="grid gap-2">
              <h3 className="font-medium text-base text-foreground">
                Language
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={selectedLanguage === "English" ? "outline" : "ghost"}
                  className={cn(
                    selectedLanguage === "English" ? "border-foreground" : "",
                    "h-fit flex-col items-start justify-start gap-0.5 py-2"
                  )}
                  aria-pressed={selectedLanguage === "English"}
                  onClick={() => setSelectedLanguage("English")}
                >
                  English{" "}
                  <span className="items-start text-muted-foreground text-xs">
                    Global
                  </span>
                </Button>
                <Button
                  type="button"
                  variant={
                    selectedLanguage === "Vietnamese" ? "outline" : "ghost"
                  }
                  className={cn(
                    selectedLanguage === "Vietnamese"
                      ? "border-foreground"
                      : "",
                    "h-fit flex-col items-start justify-start gap-0.5 py-2"
                  )}
                  aria-pressed={selectedLanguage === "Vietnamese"}
                  onClick={() => setSelectedLanguage("Vietnamese")}
                >
                  Tiếng Việt{" "}
                  <span className="text-muted-foreground text-xs">
                    Việt Nam
                  </span>
                </Button>
              </div>
            </section>
            <section className="grid gap-2">
              <h3 className="font-medium text-base text-foreground">
                Currency
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={selectedCurrency === "USD" ? "outline" : "ghost"}
                  className={cn(
                    selectedCurrency === "USD" ? "border-foreground" : "",
                    "h-fit flex-col items-start justify-start gap-0.5 py-2"
                  )}
                  aria-pressed={selectedCurrency === "USD"}
                  onClick={() => setSelectedCurrency("USD")}
                >
                  USD
                </Button>
                <Button
                  type="button"
                  variant={selectedCurrency === "VND" ? "outline" : "ghost"}
                  className={cn(
                    selectedCurrency === "VND" ? "border-foreground" : "",
                    "h-fit flex-col items-start justify-start gap-0.5 py-2"
                  )}
                  aria-pressed={selectedCurrency === "VND"}
                  onClick={() => setSelectedCurrency("VND")}
                >
                  VND
                </Button>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
