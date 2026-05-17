"use client"

import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  FileTextIcon,
  InfoIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  RadioIcon,
  SearchIcon,
  ShieldCheckIcon,
  XIcon,
  ZapIcon
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import type { PartnerAccess } from "@/lib/partner/access"
import type {
  PartnerAssignedExpo,
  PartnerCapability,
  PartnerMembershipRole,
  PartnerModel
} from "@/lib/partner/db"
import type { ExpoStatus } from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"
import { ExpoStatusBadge } from "../tradexpo/status-badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from "../ui/input-group"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
}

const EXPO_STATUSES: { label: string; value: ExpoStatus | "All" }[] = [
  { label: "All Status", value: "All" },
  { label: "Draft", value: "Draft" },
  { label: "Pending Review", value: "Pending Review" },
  { label: "Live", value: "Live" },
  { label: "Archived", value: "Archived" },
  { label: "Canceled", value: "Canceled" }
]

const PARTNERSHIP_MODELS: { label: string; value: PartnerModel | "All" }[] = [
  { label: "All Models", value: "All" },
  { label: "Co-host", value: "co_host" },
  { label: "Turnkey", value: "turnkey" },
  { label: "Tenant", value: "tenant" }
]

const PARTNERSHIP_MODEL_LABELS: Record<PartnerModel, string> = {
  co_host: "Co-host",
  turnkey: "Turnkey",
  tenant: "Tenant"
}

const MEMBERSHIP_ROLE_LABELS: Record<PartnerMembershipRole, string> = {
  primary_representative: "Primary representative",
  admin: "Admin",
  operator: "Operator",
  analyst: "Analyst",
  partner_owner: "Partner owner",
  partner_admin: "Partner admin",
  program_manager: "Program manager",
  business_manager: "Business manager",
  operations: "Operations",
  finance: "Finance",
  viewer: "Viewer"
}

const CAPABILITY_LABELS: Record<PartnerCapability, string> = {
  view_dashboard: "View Dashboard",
  manage_golive: "Manage GoLIVE",
  manage_exhibitors: "Manage Exhibitors",
  edit_expo_content: "Edit Expo Content",
  configure_operations: "Configure Operations",
  manage_branding: "Manage Branding",
  manage_tenant_settings: "Manage Tenant Settings",
  manage_partner_users: "Manage Partner Users"
}

const PAGE_SIZE = 10

export function PartnerExpoList({
  access,
  assignedExpos
}: {
  access: PartnerAccess
  assignedExpos: PartnerAssignedExpo[]
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<ExpoStatus | "All">(
    "All"
  )
  const [modelFilter, setModelFilter] = React.useState<PartnerModel | "All">(
    "All"
  )
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)

  const filteredExpos = React.useMemo(() => {
    return assignedExpos.filter(({ expo, assignment }) => {
      const matchesSearch = expo.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === "All" || expo.status === statusFilter
      const matchesModel =
        modelFilter === "All" || assignment.partnershipModel === modelFilter
      return matchesSearch && matchesStatus && matchesModel
    })
  }, [assignedExpos, searchQuery, statusFilter, modelFilter])

  const totalPages = Math.max(1, Math.ceil(filteredExpos.length / PAGE_SIZE))
  const pagedExpos = React.useMemo(() => {
    return filteredExpos.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    )
  }, [filteredExpos, currentPage])

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="space-y-6 px-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <InputGroup className="max-w-xs rounded-full">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search expos..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setCurrentPage(1)
              }}
            />
            {searchQuery && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  variant="secondary"
                  size="icon-xs"
                  className="rounded-full"
                  onClick={() => setSearchQuery("")}
                >
                  <XIcon className="size-3.5" />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>

          {/* Filter Status */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as ExpoStatus | "All")
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-44 rounded-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {EXPO_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Select Model */}
          <Select
            value={modelFilter}
            onValueChange={(value) => {
              setModelFilter(value as PartnerModel | "All")
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-44 rounded-full">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              {PARTNERSHIP_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {filteredExpos.length} expos found
        </div>
      </div>

      {pagedExpos.length > 0 ? (
        <div className="space-y-4">
          {pagedExpos.map(
            ({
              expo,
              assignment,
              goLiveCount,
              totalBooths,
              soldBooths,
              visitors,
              rfqCount,
              chatCount
            }) => {
              const isExpanded = expandedId === expo.id
              const showMetrics = [
                "Live",
                "Archived",
                "Pending Review"
              ].includes(expo.status)

              return (
                <Card
                  key={expo.id}
                  className={cn(
                    "overflow-hidden border-sidebar-border transition-all duration-200",
                    isExpanded ? "ring-1 ring-primary/50" : "hover:shadow-sm"
                  )}
                >
                  <div className="flex flex-col items-stretch md:flex-row">
                    {/* Thumbnail */}
                    <div className="relative aspect-video h-32 shrink-0 overflow-hidden border-b bg-muted md:h-auto md:w-48 md:border-r md:border-b-0">
                      <Image
                        src={expo.thumbnailUrl}
                        alt={expo.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <ExpoStatusBadge status={expo.status} />
                      </div>
                    </div>

                    {/* Main Info */}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-sm leading-tight transition-colors group-hover:text-primary">
                            {expo.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              <span>
                                {formatDate(expo.startDate)} –{" "}
                                {formatDate(expo.endDate)}
                              </span>
                            </div>
                            {goLiveCount > 0 && (
                              <div className="flex items-center gap-1 font-medium text-primary">
                                <RadioIcon className="h-3 w-3" />
                                {goLiveCount} GoLIVE
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          aria-label={
                            isExpanded
                              ? `Collapse details for ${expo.name}`
                              : `Expand details for ${expo.name}`
                          }
                          aria-expanded={isExpanded}
                          className={cn(
                            "h-7 w-7 transition-transform",
                            isExpanded && "rotate-180 bg-accent"
                          )}
                          onClick={() => toggleExpand(expo.id)}
                        >
                          <ChevronDownIcon className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-muted-foreground/70 text-xs uppercase">
                              Role
                            </span>
                            <span className="font-medium text-xs">
                              {
                                MEMBERSHIP_ROLE_LABELS[
                                  assignment.membershipRole
                                ]
                              }
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-muted-foreground/70 text-xs uppercase">
                              Model
                            </span>
                            <span className="font-medium text-xs capitalize">
                              {
                                PARTNERSHIP_MODEL_LABELS[
                                  assignment.partnershipModel
                                ]
                              }
                            </span>
                          </div>
                        </div>

                        {access.actions["expo.edit"] ? (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 font-semibold text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link href={`/partner/expos/${expo.id}`}>
                              Manage
                              <ChevronRightIcon className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="fade-in slide-in-from-top-1 animate-in border-t bg-muted/5 px-4 py-4 duration-200 md:px-6 md:py-6">
                      <div className="space-y-8 md:ml-48">
                        {/* Metrics Section */}
                        {showMetrics && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 font-bold font-mono text-muted-foreground text-xs uppercase tracking-wider">
                              <ZapIcon className="h-3 w-3 text-amber-500" />
                              Operational Metrics
                            </div>
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                              <div className="flex flex-col gap-1 rounded-xl border border-sidebar-border bg-card p-3 shadow-xs">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <EyeIcon className="h-3.5 w-3.5" />
                                  <span className="font-semibold text-xs uppercase">
                                    Total Views
                                  </span>
                                </div>
                                <span className="font-bold text-lg tabular-nums">
                                  {new Intl.NumberFormat().format(visitors)}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1 rounded-xl border border-sidebar-border bg-card p-3 shadow-xs">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <LayoutDashboardIcon className="h-3.5 w-3.5" />
                                  <span className="font-semibold text-xs uppercase">
                                    Booths
                                  </span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                  <span className="font-bold text-lg tabular-nums">
                                    {soldBooths}
                                  </span>
                                  <span className="font-medium text-muted-foreground text-xs">
                                    / {totalBooths}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 rounded-xl border border-sidebar-border bg-card p-3 shadow-xs">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <FileTextIcon className="h-3.5 w-3.5" />
                                  <span className="font-semibold text-xs uppercase">
                                    RFQs Created
                                  </span>
                                </div>
                                <span className="font-bold text-lg tabular-nums">
                                  {new Intl.NumberFormat().format(rfqCount)}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1 rounded-xl border border-sidebar-border bg-card p-3 shadow-xs">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MessageSquareIcon className="h-3.5 w-3.5" />
                                  <span className="font-semibold text-xs uppercase">
                                    Chat Now
                                  </span>
                                </div>
                                <span className="font-bold text-lg tabular-nums">
                                  {new Intl.NumberFormat().format(chatCount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                              <InfoIcon className="h-3 w-3" />
                              Organization Details
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between border-sidebar-border border-b border-dashed py-1.5">
                                <span className="text-muted-foreground">
                                  Organization:
                                </span>
                                <span className="text-right font-medium">
                                  {assignment.partnerOrganization.name}
                                </span>
                              </div>
                              <div className="flex justify-between border-sidebar-border border-b border-dashed py-1.5">
                                <span className="text-muted-foreground">
                                  Status:
                                </span>
                                <Badge
                                  variant={
                                    assignment.partnerOrganization.status ===
                                    "active"
                                      ? "outline"
                                      : "destructive"
                                  }
                                  className="h-4 px-1.5 font-bold text-xs uppercase"
                                >
                                  {assignment.partnerOrganization.status ===
                                  "active"
                                    ? "Active"
                                    : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex justify-between py-1.5">
                                <span className="text-muted-foreground">
                                  Description:
                                </span>
                                <span className="max-w-45 truncate text-right text-muted-foreground italic">
                                  {expo.description ||
                                    "No description provided"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                              <ShieldCheckIcon className="h-3 w-3" />
                              Capabilities
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {assignment.capabilities.map((cap) => (
                                <Badge
                                  key={cap}
                                  variant="secondary"
                                  className="border px-1.5 py-0 font-normal text-xs"
                                >
                                  {CAPABILITY_LABELS[cap] || cap}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )
            }
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      text="Previous"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage > 1) setCurrentPage(currentPage - 1)
                      }}
                      className={cn(
                        "h-8 text-xs",
                        currentPage === 1 && "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1
                    if (
                      totalPages > 5 &&
                      page !== 1 &&
                      page !== totalPages &&
                      Math.abs(page - currentPage) > 1
                    ) {
                      if (Math.abs(page - currentPage) === 2) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }
                      return null
                    }

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === currentPage}
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(page)
                          }}
                          className="h-8 w-8 text-xs"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      text="Next"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage < totalPages)
                          setCurrentPage(currentPage + 1)
                      }}
                      className={cn(
                        "h-8 text-xs",
                        currentPage === totalPages &&
                          "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      ) : assignedExpos.length === 0 ? (
        <Card className="flex min-h-75 flex-col items-center justify-center border-dashed bg-muted/20 p-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <CalendarIcon className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <CardTitle className="mt-4 font-semibold text-sm">
            No expo programs assigned yet
          </CardTitle>
          <CardDescription className="mt-1 max-w-80 text-xs">
            Ask an admin to assign your partner organization to an expo program.
            Assigned expos will appear here for operations and GoLIVE work.
          </CardDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-4 h-8 text-xs"
          >
            Refresh assignments
          </Button>
        </Card>
      ) : (
        <Card className="flex min-h-75 flex-col items-center justify-center border-dashed bg-muted/20 p-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <SearchIcon className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <CardTitle className="mt-4 font-semibold text-sm">
            No results found
          </CardTitle>
          <CardDescription className="mt-1 max-w-60 text-xs">
            Try adjusting your search keywords or status filters.
          </CardDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("")
              setStatusFilter("All")
              setModelFilter("All")
            }}
            className="mt-4 h-8 text-xs"
          >
            Reset Filters
          </Button>
        </Card>
      )}
    </div>
  )
}
