"use client"

import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileTextIcon,
  InfoIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  RadioIcon,
  SearchIcon,
  ShieldCheckIcon,
  ZapIcon
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
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
import type { PartnerAssignedExpo, PartnerCapability } from "@/lib/partner/db"
import type { ExpoStatus } from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"
import { ExpoStatusBadge } from "../tradexpo/status-badge"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group"

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
  assignedExpos
}: {
  assignedExpos: PartnerAssignedExpo[]
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<ExpoStatus | "All">(
    "All"
  )
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)

  const filteredExpos = React.useMemo(() => {
    return assignedExpos.filter(({ expo }) => {
      const matchesSearch = expo.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === "All" || expo.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [assignedExpos, searchQuery, statusFilter])

  const totalPages = Math.ceil(filteredExpos.length / PAGE_SIZE)
  const pagedExpos = React.useMemo(() => {
    return filteredExpos.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    )
  }, [filteredExpos, currentPage])

  // Reset page when filtering
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <InputGroup className="max-w-xs">
            <InputGroupAddon>
              <SearchIcon className="text-muted-foreground h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search expos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as ExpoStatus | "All")
            }
          >
            <SelectTrigger className="w-[180px]">
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
        </div>
        <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          {filteredExpos.length} expos found
        </div>
      </div>

      {pagedExpos.length > 0 ? (
        <div className="space-y-4">
          {pagedExpos.map(({ expo, assignment, goLiveCount, totalBooths, soldBooths, visitors, rfqCount, chatCount }) => {
            const isExpanded = expandedId === expo.id
            const showMetrics = ["Live", "Archived", "Pending Review"].includes(expo.status)

            return (
              <Card
                key={expo.id}
                className={cn(
                  "overflow-hidden transition-all duration-200 border-sidebar-border",
                  isExpanded ? "ring-1 ring-primary/50" : "hover:shadow-sm"
                )}
              >
                <div
                  className="flex flex-col md:flex-row items-stretch cursor-pointer"
                  onClick={() => toggleExpand(expo.id)}
                >
                  {/* Thumbnail */}
                  <div className="relative h-32 md:h-auto md:w-48 aspect-video overflow-hidden shrink-0 border-b md:border-b-0 md:border-r bg-muted">
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
                        <h3 className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                          {expo.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-[10px] md:text-xs">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>
                              {formatDate(expo.startDate)} – {formatDate(expo.endDate)}
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
                        className={cn(
                          "h-7 w-7 transition-transform",
                          isExpanded && "rotate-180 bg-accent"
                        )}
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground/70">Role</span>
                          <span className="text-[11px] font-medium">{assignment.membershipRole}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground/70">Model</span>
                          <span className="text-[11px] font-medium capitalize">{assignment.partnershipModel}</span>
                        </div>
                      </div>
i
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] font-semibold px-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/partner/expos/${expo.id}`}>
                          Manage
                          <ChevronRightIcon className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t bg-muted/5 px-4 py-4 md:px-6 md:py-6 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="md:ml-48 space-y-8">
                      {/* Metrics Section */}
                      {showMetrics && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                            <ZapIcon className="h-3 w-3 text-amber-500" />
                            Operational Metrics
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="bg-card border border-sidebar-border rounded-xl p-3 flex flex-col gap-1 shadow-xs">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <EyeIcon className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-semibold uppercase">Total Views</span>
                              </div>
                              <span className="text-lg font-bold tabular-nums">
                                {new Intl.NumberFormat().format(visitors)}
                              </span>
                            </div>
                            <div className="bg-card border border-sidebar-border rounded-xl p-3 flex flex-col gap-1 shadow-xs">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <LayoutDashboardIcon className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-semibold uppercase">Booths</span>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold tabular-nums">{soldBooths}</span>
                                <span className="text-muted-foreground text-xs font-medium">/ {totalBooths}</span>
                              </div>
                            </div>
                            <div className="bg-card border border-sidebar-border rounded-xl p-3 flex flex-col gap-1 shadow-xs">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <FileTextIcon className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-semibold uppercase">RFQs Created</span>
                              </div>
                              <span className="text-lg font-bold tabular-nums">
                                {new Intl.NumberFormat().format(rfqCount)}
                              </span>
                            </div>
                            <div className="bg-card border border-sidebar-border rounded-xl p-3 flex flex-col gap-1 shadow-xs">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MessageSquareIcon className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-semibold uppercase">Chat Now</span>
                              </div>
                              <span className="text-lg font-bold tabular-nums">
                                {new Intl.NumberFormat().format(chatCount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <InfoIcon className="h-3 w-3" />
                            Organization Details
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1.5 border-b border-sidebar-border border-dashed">
                              <span className="text-muted-foreground">Organization:</span>
                              <span className="font-medium text-right">{assignment.partnerOrganization.name}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-sidebar-border border-dashed">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant={assignment.partnerOrganization.status === "active" ? "outline" : "destructive"} className="h-4 text-[9px] font-bold uppercase px-1.5">
                                {assignment.partnerOrganization.status === "active" ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex justify-between py-1.5">
                              <span className="text-muted-foreground">Description:</span>
                              <span className="text-muted-foreground italic text-right max-w-[180px] truncate">
                                {expo.description || "No description provided"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <ShieldCheckIcon className="h-3 w-3" />
                            Capabilities
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {assignment.capabilities.map((cap) => (
                              <Badge
                                key={cap}
                                variant="secondary"
                                className="font-normal text-[10px] border px-1.5 py-0"
                              >
                                {CAPABILITY_LABELS[cap] || cap}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 md:ml-48 flex justify-end">
                       <Button asChild size="sm" className="h-8 text-[11px] px-4 font-semibold">
                          <Link href={`/partner/expos/${expo.id}`}>
                            Access Expo Dashboard
                            <ExternalLinkIcon className="ml-2 h-3 w-3" />
                          </Link>
                       </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-4 flex justify-center">
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
                      className={cn("h-8 text-xs", currentPage === 1 && "pointer-events-none opacity-50")}
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
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                      }}
                      className={cn("h-8 text-xs", currentPage === totalPages && "pointer-events-none opacity-50")}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      ) : (
        <Card className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center bg-muted/20 border-dashed">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <SearchIcon className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <CardTitle className="mt-4 text-sm font-semibold">No results found</CardTitle>
          <CardDescription className="mt-1 text-xs max-w-[240px]">
            Try adjusting your search keywords or status filters.
          </CardDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("")
              setStatusFilter("All")
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
