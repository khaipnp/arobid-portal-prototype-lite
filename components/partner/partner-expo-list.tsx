"use client";

import {
  CalendarIcon,
  EyeIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  LockIcon,
  MessageSquareIcon,
  RadioIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PartnerAccess } from "@/lib/partner/access";
import type {
  PartnerAssignedExpo,
  PartnerCapability,
  PartnerMembershipRole,
  PartnerModel,
} from "@/lib/partner/db";
import type { ExpoStatus } from "@/lib/tradexpo/types";
import { cn } from "@/lib/utils";
import { ExpoStatusBadge } from "../tradexpo/status-badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const EXPO_STATUSES: { label: string; value: ExpoStatus | "All" }[] = [
  { label: "All Status", value: "All" },
  { label: "Draft", value: "Draft" },
  { label: "Pending Review", value: "Pending Review" },
  { label: "Live", value: "Live" },
  { label: "Archived", value: "Archived" },
  { label: "Canceled", value: "Canceled" },
];

const PARTNERSHIP_MODEL_LABELS: Record<PartnerModel, string> = {
  co_host: "Co-host",
  turnkey: "Turnkey",
  tenant: "Tenant",
};

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
  viewer: "Viewer",
};

const _CAPABILITY_LABELS: Record<PartnerCapability, string> = {
  view_dashboard: "View Dashboard",
  manage_golive: "Manage GoLIVE",
  manage_exhibitors: "Manage Exhibitors",
  edit_expo_content: "Edit Expo Content",
  configure_operations: "Configure Operations",
  manage_branding: "Manage Branding",
  manage_tenant_settings: "Manage Tenant Settings",
  manage_partner_users: "Manage Partner Users",
};

const PAGE_SIZE = 10;

export function PartnerExpoList({
  access,
  assignedExpos,
}: {
  access: PartnerAccess;
  assignedExpos: PartnerAssignedExpo[];
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ExpoStatus | "All">(
    "All",
  );
  const [currentPage, setCurrentPage] = React.useState(1);

  const filteredExpos = React.useMemo(() => {
    return assignedExpos.filter(({ expo }) => {
      const matchesSearch = expo.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || expo.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assignedExpos, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredExpos.length / PAGE_SIZE));
  const pagedExpos = React.useMemo(() => {
    return filteredExpos.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );
  }, [filteredExpos, currentPage]);

  React.useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <InputGroup className="max-w-3xs">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Expo name..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-full"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                >
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>

          {/* Filter Status */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as ExpoStatus | "All");
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-40">
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
              chatCount,
            }) => {
              const isTurnkey = assignment.partnershipModel === "turnkey";
              const showMetrics = [
                "Live",
                "Archived",
                "Pending Review",
              ].includes(expo.status);

              return (
                <div
                  key={expo.id}
                  className="overflow-hidden rounded-2xl border"
                >
                  <div className="flex flex-col items-stretch md:flex-row">
                    {/* Thumbnail */}

                    <Link
                      href={`/partner/expo-program/expos/${expo.id}`}
                      className="font-medium text-lg leading-tight transition-colors group-hover:text-primary"
                    >
                      <Image
                        src={expo.thumbnailUrl}
                        alt={expo.name}
                        width={1600}
                        height={900}
                        className="aspect-video max-w-md object-cover"
                      />
                    </Link>

                    {/* Main Info */}
                    <div className="flex flex-1 flex-col p-4 lg:px-6 lg:py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <Link
                            href={`/partner/expo-program/expos/${expo.id}`}
                            className="line-clamp-2 font-semibold text-xl leading-none"
                          >
                            {expo.name}
                          </Link>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-sm">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              <span>
                                {formatDate(expo.startDate ?? "")} –{" "}
                                {formatDate(expo.endDate ?? "")}
                              </span>
                            </div>
                            {goLiveCount > 0 && (
                              <div className="flex items-center gap-1 font-medium text-primary">
                                <RadioIcon className="h-3 w-3" />
                                {goLiveCount} GoLIVE
                              </div>
                            )}
                            {isTurnkey ? (
                              <div className="flex items-center gap-1 font-medium text-blue-600">
                                <LockIcon className="h-3 w-3" />
                                Arobid-configured
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <ExpoStatusBadge status={expo.status} />
                      </div>

                      <div className="mt-5 space-y-8">
                        {/* Metrics Section */}
                        {showMetrics && (
                          <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                            <MetricComp
                              label="Total Views"
                              value={new Intl.NumberFormat().format(visitors)}
                              icon={
                                <EyeIcon className="size-4" strokeWidth="2" />
                              }
                            />
                            <MetricComp
                              label="Booths"
                              value={`${soldBooths} / ${totalBooths}`}
                              icon={
                                <LayoutDashboardIcon
                                  className="size-4"
                                  strokeWidth="2"
                                />
                              }
                            />
                            <MetricComp
                              label="RFQs Created"
                              value={new Intl.NumberFormat().format(rfqCount)}
                              icon={
                                <FileTextIcon
                                  className="size-4"
                                  strokeWidth="2"
                                />
                              }
                            />
                            <MetricComp
                              label="Chat Now"
                              value={new Intl.NumberFormat().format(chatCount)}
                              icon={
                                <MessageSquareIcon
                                  className="size-4"
                                  strokeWidth="2"
                                />
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            },
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
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={cn(
                        "h-8 text-xs",
                        currentPage === 1 && "pointer-events-none opacity-50",
                      )}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
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
                        );
                      }
                      return null;
                    }

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          className="h-8 w-8 text-xs"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      text="Next"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage(currentPage + 1);
                      }}
                      className={cn(
                        "h-8 text-xs",
                        currentPage === totalPages &&
                          "pointer-events-none opacity-50",
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
            No self-create or self-configure action is available in Partner
            Portal.
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
              setSearchQuery("");
              setStatusFilter("All");
            }}
            className="mt-4 h-8 text-xs"
          >
            Reset Filters
          </Button>
        </Card>
      )}
    </div>
  );
}

function MetricComp({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="p-2 text-legend bg-legend-100 rounded-lg">{icon}</div>
        <span className="font-medium text-sm capitalize">{label}</span>
      </div>
      <span className="font-semibold text-base tabular-nums">{value}</span>
    </div>
  );
}
