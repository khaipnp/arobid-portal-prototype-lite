"use client"

import { ChevronLeftIcon } from "lucide-react"
import { useRouter } from "next/navigation"
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
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex w-full items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <BreadcrumbItem key={crumb.label}>
                    {index === lastIndex ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href || "#"}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                    {index < lastIndex ? <BreadcrumbSeparator /> : null}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col">
        {title && (
          <div className="flex items-center gap-4 p-4">
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
    </>
  )
}

function BackButton() {
  const router = useRouter()

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label="Go back"
      onClick={() => router.back()}
    >
      <ChevronLeftIcon />
    </Button>
  )
}
