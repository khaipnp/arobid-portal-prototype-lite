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

const languageOptions = [
  { language: "English", region: "Global", value: "English" },
  { language: "Tiếng Việt", region: "Việt Nam", value: "Vietnamese" },
  { language: "简体中文", region: "美国", value: "简体中文" },
  { language: "Français", region: "France", value: "Français" },
  { language: "한국어", region: "대한민국", value: "한국어" },
  { language: "Dutch", region: "Netherlands", value: "Dutch" }
]

const currencyOptions = [
  { currency: "USD", value: "USD" },
  { currency: "EUR", value: "EUR" },
  { currency: "GBP", value: "GBP" },
  { currency: "JPY", value: "JPY" },
  { currency: "VND", value: "VND" },
  { currency: "KRW", value: "KRW" }
]

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
        <DialogContent className="sm:max-w-2xl">
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
              <div className="grid grid-cols-4 gap-3">
                {languageOptions.map(({ language, region, value }) => (
                  <LanguageSelector
                    key={value}
                    language={language}
                    region={region}
                    selectedLanguage={selectedLanguage}
                    value={value}
                    onSelect={setSelectedLanguage}
                  />
                ))}
              </div>
            </section>
            <section className="grid gap-2">
              <h3 className="font-medium text-base text-foreground">
                Currency
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {currencyOptions.map(({ currency, value }) => (
                  <CurrencySelector
                    key={value}
                    currency={currency}
                    selectedCurrency={selectedCurrency}
                    value={value}
                    onSelect={setSelectedCurrency}
                  />
                ))}
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Function to render a language selector

type LanguageSelectorProps = {
  language: string
  region: string
  selectedLanguage: string
  value: string
  onSelect: (language: string) => void
}

function LanguageSelector({
  language,
  region,
  selectedLanguage,
  value,
  onSelect
}: LanguageSelectorProps) {
  const isSelected = selectedLanguage === value

  return (
    <Button
      type="button"
      variant={isSelected ? "outline" : "ghost"}
      className={cn(
        isSelected ? "border-foreground" : "",
        "h-fit flex-col items-start justify-start gap-0.5 py-2"
      )}
      aria-pressed={isSelected}
      onClick={() => onSelect(value)}
    >
      {language}
      <span className="items-start text-muted-foreground text-xs">
        {region}
      </span>
    </Button>
  )
}

// Function to render a currency selector

type CurrencySelectorProps = {
  currency: string
  selectedCurrency: string
  value: string
  onSelect: (currency: string) => void
}

function CurrencySelector({
  currency,
  selectedCurrency,
  value,
  onSelect
}: CurrencySelectorProps) {
  const isSelected = selectedCurrency === value

  return (
    <Button
      type="button"
      variant={isSelected ? "outline" : "ghost"}
      className={cn(
        isSelected ? "border-foreground" : "",
        "h-fit flex-col items-start justify-start gap-0.5 py-2"
      )}
      aria-pressed={isSelected}
      onClick={() => onSelect(value)}
    >
      {currency}
    </Button>
  )
}
