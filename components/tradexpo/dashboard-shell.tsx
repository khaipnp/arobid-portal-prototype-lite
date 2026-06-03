"use client"

import { ChevronLeftIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Fragment } from "react"
import { NotificationTrigger } from "@/components/notifications/notification-trigger"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "../ui/button"

interface Crumb {
  label: string
  href?: string
}

interface DashboardShellProps {
  title?: string
  description?: string
  breadcrumbs: Crumb[]
  children: React.ReactNode
  showBackButton?: boolean
}

export function DashboardShell({
  title,
  description,
  breadcrumbs,
  children,
  showBackButton
}: DashboardShellProps) {
  const lastIndex = breadcrumbs.length - 1

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <nav className="sticky top-0 z-10 flex h-11 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-11">
        <div className="flex w-full items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-1">
            <SidebarTrigger className="-ml-1 rounded-full" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <Fragment key={crumb.label}>
                    <BreadcrumbItem>
                      {index === lastIndex ? (
                        <BreadcrumbPage className="select-none font-medium">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.href || "#"}>
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < lastIndex ? <BreadcrumbSeparator /> : null}
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {/* Notification Trigger */}
          <NotificationTrigger className="rounded-full" />
        </div>
      </nav>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col p-4 lg:px-18 lg:py-6">
          {title && (
            <div className="flex items-center gap-3">
              {showBackButton ? <BackButton /> : null}
              <section>
                <h1 className="font-semibold text-xl">{title}</h1>
                {description ? (
                  <p className="text-muted-foreground text-sm">{description}</p>
                ) : null}
              </section>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}

function BackButton() {
  const router = useRouter()

  return (
    <Button
      className="rounded-full"
      variant="secondary"
      size="icon"
      aria-label="Go back"
      onClick={() => router.back()}
    >
      <ChevronLeftIcon />
    </Button>
  )
}
