"use client"

import { AlertCircleIcon, RefreshCwIcon, SearchIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from "@/components/ui/input-group"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type { CompanyListResponse } from "@/lib/administration/companies"
import type {
  AdminCompany,
  CompanyCategoryOption,
  PaginationMeta
} from "@/lib/administration/types"

const PAGE_SIZE = 20
const TABLE_HEADERS = [
  "Company",
  "Tax ID",
  "Industry",
  "Website",
  "Address",
  "Status"
]

interface AdminCompaniesPageProps {
  initialData: CompanyListResponse
}

function getCompanyInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return initials || "—"
}

function renderCompanyRows(companies: AdminCompany[]) {
  return companies.map((company) => (
    <TableRow key={company.id}>
      <TableCell>
        <Link
          aria-label={`View details for ${company.name}`}
          className="flex w-fit items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href={`/admin/administration/companies/${company.id}`}
        >
          <Avatar size="lg">
            {company.logoUrl ? (
              <AvatarImage src={company.logoUrl} alt={`${company.name} logo`} />
            ) : null}
            <AvatarFallback>{getCompanyInitials(company.name)}</AvatarFallback>
          </Avatar>

          <span className="font-medium hover:underline">{company.name}</span>
        </Link>
      </TableCell>
      <TableCell className="font-mono text-xs">
        {company.taxId ?? "—"}
      </TableCell>
      <TableCell className="max-w-80 whitespace-normal">
        {company.categoryNames.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {company.categoryNames.map((categoryName) => (
              <Badge key={categoryName} variant="secondary">
                {categoryName}
              </Badge>
            ))}
          </div>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="max-w-56 truncate">
        {company.website ?? "—"}
      </TableCell>
      <TableCell className="max-w-72 truncate">
        {company.address ?? "—"}
      </TableCell>
      <TableCell>
        <Badge variant={company.isActive ? "default" : "secondary"}>
          {company.isActive ? "Approved" : "Pending"}
        </Badge>
      </TableCell>
    </TableRow>
  ))
}

export function AdminCompaniesPage({ initialData }: AdminCompaniesPageProps) {
  const [rows, setRows] = useState<AdminCompany[]>(initialData.data)
  const [categories, setCategories] = useState<CompanyCategoryOption[]>(
    initialData.categories
  )
  const [meta, setMeta] = useState<PaginationMeta>(initialData.meta)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput)
      setMeta((current) => ({ ...current, page: 1 }))
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const load = async () => {
      setLoading(rows.length === 0)
      setError(null)

      try {
        const params = new URLSearchParams({
          page: String(meta.page),
          pageSize: String(PAGE_SIZE),
          search,
          categoryId: categoryFilter,
          status: statusFilter,
          refresh: String(refreshKey)
        })
        const response = await fetch(
          `/api/admin/administration/companies?${params}`,
          {
            cache: "default",
            signal: controller.signal
          }
        )

        if (!response.ok) {
          throw new Error("Unable to load companies")
        }

        const payload = (await response.json()) as CompanyListResponse
        if (!cancelled) {
          setRows(payload.data)
          setCategories(payload.categories)
          setMeta(payload.meta)
        }
      } catch (fetchError) {
        if (!cancelled) {
          const isAbort =
            fetchError instanceof DOMException &&
            fetchError.name === "AbortError"
          if (!isAbort) {
            setError("Failed to load companies. Please try again.")
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [categoryFilter, meta.page, refreshKey, rows.length, search, statusFilter])

  function handleCategoryFilterChange(value: string) {
    setCategoryFilter(value)
    setMeta((current) => ({ ...current, page: 1 }))
  }

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value)
    setMeta((current) => ({ ...current, page: 1 }))
  }

  function retry() {
    setRefreshKey((current) => current + 1)
  }

  const skeletonRowKeys = [
    "skeleton-row-1",
    "skeleton-row-2",
    "skeleton-row-3",
    "skeleton-row-4",
    "skeleton-row-5",
    "skeleton-row-6"
  ]

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <InputGroup className="w-full rounded-full md:w-xs">
            <InputGroupInput
              aria-label="Search companies"
              value={searchInput}
              placeholder="Search companies..."
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
          <Select
            value={categoryFilter}
            onValueChange={handleCategoryFilterChange}
          >
            <SelectTrigger
              aria-label="Filter by industry"
              className="w-full rounded-full md:w-56"
            >
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All industries</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger
              aria-label="Filter by company status"
              className="w-full rounded-full md:w-40"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm">{error}</p>
          <Button className="mt-3" variant="outline" onClick={retry}>
            <RefreshCwIcon />
            Retry
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                {TABLE_HEADERS.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                skeletonRowKeys.map((rowKey) => (
                  <TableRow key={rowKey}>
                    {TABLE_HEADERS.map((header) => (
                      <TableCell key={`${rowKey}-${header}`}>
                        <Skeleton className="h-5 w-full max-w-52" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_HEADERS.length}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <AlertCircleIcon className="mx-auto mb-2 size-8 opacity-40" />
                    No companies found.
                  </TableCell>
                </TableRow>
              ) : (
                renderCompanyRows(rows)
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-muted-foreground text-sm">
        <span>
          {meta.totalItems} compan{meta.totalItems === 1 ? "y" : "ies"} total
        </span>
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text="Previous"
                onClick={(event) => {
                  event.preventDefault()
                  if (meta.page > 1 && !loading) {
                    setMeta((current) => ({
                      ...current,
                      page: current.page - 1
                    }))
                  }
                }}
                className={
                  meta.page <= 1 || loading
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
            <PaginationItem>
              <span className="flex h-9 items-center px-2">
                {meta.page} / {meta.totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                text="Next"
                onClick={(event) => {
                  event.preventDefault()
                  if (meta.page < meta.totalPages && !loading) {
                    setMeta((current) => ({
                      ...current,
                      page: current.page + 1
                    }))
                  }
                }}
                className={
                  meta.page >= meta.totalPages || loading
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
