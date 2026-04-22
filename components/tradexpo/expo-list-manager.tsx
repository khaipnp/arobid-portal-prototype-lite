"use client"

import {
  CheckIcon,
  ChevronDownIcon,
  MoreHorizontalIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DateRangePicker,
  type DateRange,
} from "@/components/ui/date-range-picker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Expo, ExpoCategory, ExpoStatus } from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from "../ui/input-group"

const ALL_STATUSES: ExpoStatus[] = [
  "Draft",
  "Pending Review",
  "Live",
  "Ended",
  "Archived",
  "Canceled",
]

const statusStyles: Record<ExpoStatus, string> = {
  Draft: "border-slate-300 bg-slate-100 text-slate-700",
  "Pending Review": "border-amber-300 bg-amber-100 text-amber-700",
  Live: "border-emerald-300 bg-emerald-100 text-emerald-700",
  Ended: "border-zinc-300 bg-zinc-100 text-zinc-700",
  Archived: "border-purple-300 bg-purple-100 text-purple-700",
  Canceled: "border-rose-300 bg-rose-100 text-rose-700",
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "short" }).format(
    new Date(iso),
  )
}

function toLocalIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

type ConfirmAction =
  | { type: "archive"; expo: Expo }
  | { type: "delete"; expo: Expo }
  | { type: "approve"; expo: Expo }

export function ExpoListManager({
  initialExpos,
  initialCategories,
}: {
  initialExpos: Expo[]
  initialCategories: ExpoCategory[]
}) {
  const [expos, setExpos] = React.useState<Expo[]>(() =>
    initialExpos
      .map((expo) => ({ ...expo }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  )
  const [searchInput, setSearchInput] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<ExpoStatus | "All">(
    "All",
  )
  const [categoryFilter, setCategoryFilter] = React.useState<string[]>([])
  const [dateRangeFilter, setDateRangeFilter] = React.useState<
    DateRange | undefined
  >(undefined)
  const [page, setPage] = React.useState(1)
  const [confirmAction, setConfirmAction] =
    React.useState<ConfirmAction | null>(null)
  const [notice, setNotice] = React.useState<{
    type: "success" | "error" | "info"
    text: string
  } | null>(null)

  const categories: ExpoCategory[] = initialCategories

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(1)
    }, 500)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const filteredExpos = React.useMemo(() => {
    let result = expos

    if (debouncedSearch.trim()) {
      const keyword = debouncedSearch.trim().toLowerCase()
      result = result.filter(
        (expo) =>
          expo.name.toLowerCase().includes(keyword) ||
          expo.ownerEmail.toLowerCase().includes(keyword),
      )
    }

    if (statusFilter !== "All") {
      result = result.filter((expo) => expo.status === statusFilter)
    }

    if (categoryFilter.length > 0) {
      result = result.filter((expo) =>
        categoryFilter.every((catId) => expo.categoryIds.includes(catId)),
      )
    }

    const startDateFilter = dateRangeFilter?.from
      ? toLocalIsoDate(dateRangeFilter.from)
      : ""
    const endDateFilter = dateRangeFilter?.to
      ? toLocalIsoDate(dateRangeFilter.to)
      : ""

    if (startDateFilter) {
      result = result.filter((expo) => expo.startDate >= startDateFilter)
    }

    if (endDateFilter) {
      result = result.filter((expo) => expo.endDate <= endDateFilter)
    }

    return result
  }, [
    expos,
    debouncedSearch,
    statusFilter,
    categoryFilter,
    dateRangeFilter,
  ])

  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(filteredExpos.length / pageSize))

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pagedExpos = React.useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredExpos.slice(start, start + pageSize)
  }, [filteredExpos, page])

  function toggleCategory(catId: string) {
    setCategoryFilter((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId],
    )
    setPage(1)
  }

  async function handleConfirm() {
    if (!confirmAction) return

    const { type, expo } = confirmAction
    try {
      if (type === "archive") {
        const response = await fetch(`/api/tradexpo/expos/${expo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Archived" satisfies ExpoStatus }),
        })
        if (!response.ok) {
          setNotice({
            type: "error",
            text: `Failed to archive "${expo.name}".`,
          })
          return
        }
        setExpos((prev) =>
          prev.map((e) =>
            e.id === expo.id ? { ...e, status: "Archived" as ExpoStatus } : e,
          ),
        )
        setNotice({
          type: "success",
          text: `"${expo.name}" has been archived.`,
        })
      } else if (type === "delete") {
        const response = await fetch(`/api/tradexpo/expos/${expo.id}`, {
          method: "DELETE",
        })
        if (!response.ok) {
          setNotice({ type: "error", text: `Failed to delete "${expo.name}".` })
          return
        }
        setExpos((prev) => prev.filter((e) => e.id !== expo.id))
        setNotice({ type: "success", text: `"${expo.name}" has been deleted.` })
      } else if (type === "approve") {
        const response = await fetch(`/api/tradexpo/expos/${expo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Live" satisfies ExpoStatus }),
        })
        if (!response.ok) {
          setNotice({
            type: "error",
            text: `Failed to approve "${expo.name}".`,
          })
          return
        }
        setExpos((prev) =>
          prev.map((e) =>
            e.id === expo.id ? { ...e, status: "Live" as ExpoStatus } : e,
          ),
        )
        setNotice({
          type: "success",
          text: `"${expo.name}" is now Live. Approval notification sent to ${expo.ownerEmail}.`,
        })
      }
    } catch {
      setNotice({ type: "error", text: "Network error. Please try again." })
      return
    }

    setConfirmAction(null)
  }

  const confirmMeta = React.useMemo(() => {
    if (!confirmAction) return null

    if (confirmAction.type === "approve") {
      return {
        title: "Approve Expo?",
        description: `This will set "${confirmAction.expo.name}" to Live and notify the owner at ${confirmAction.expo.ownerEmail}.`,
        actionLabel: "Approve",
        variant: "default" as const,
      }
    }

    if (confirmAction.type === "archive") {
      return {
        title: "Archive Expo?",
        description: `"${confirmAction.expo.name}" will be archived and removed from the public listing.`,
        actionLabel: "Archive",
        variant: "default" as const,
      }
    }

    return {
      title: "Delete Expo?",
      description: `This will permanently delete "${confirmAction.expo.name}". This action cannot be undone.`,
      actionLabel: "Delete",
      variant: "destructive" as const,
    }
  }, [confirmAction])

  return (
    <div className="grid gap-4">
      <section>
        <div className="grid gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild className="w-fit">
              <Link href="/admin/tradexpo/expos/new">
                Create new
              </Link>
            </Button>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <InputGroup className="max-w-xs">
              <InputGroupInput
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by expo name or owner email…"
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              {searchInput && (
                <InputGroupButton size="icon-xs" className="rounded-full" variant="ghost" onClick={() => setSearchInput("")}>
                  <XIcon />
                  <span className="sr-only">Clear search</span>
                </InputGroupButton>
              )}
            </InputGroup>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as ExpoStatus | "All")
                setPage(1)
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-44 justify-between rounded-lg font-normal"
                >
                  {categoryFilter.length > 0
                    ? `${categoryFilter.length} categor${categoryFilter.length === 1 ? "y" : "ies"}`
                    : "All Categories"}
                  <ChevronDownIcon className="ml-1 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {categories.map((cat) => (
                  <DropdownMenuItem
                    key={cat.id}
                    onSelect={(e) => {
                      e.preventDefault()
                      toggleCategory(cat.id)
                    }}
                  >
                    <span className="mr-2 flex h-4 w-4 items-center justify-center rounded border border-muted-foreground/30">
                      {categoryFilter.includes(cat.id) && (
                        <CheckIcon className="h-3 w-3" />
                      )}
                    </span>
                    {cat.name}
                  </DropdownMenuItem>
                ))}
                {categoryFilter.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault()
                        setCategoryFilter([])
                        setPage(1)
                      }}
                      className="text-muted-foreground"
                    >
                      Clear selection
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <div className="flex items-center gap-2">
                <DateRangePicker
                  value={dateRangeFilter}
                  onChange={(range) => {
                    setDateRangeFilter(range)
                    setPage(1)
                  }}
                  className="w-76"
                />
                {(dateRangeFilter?.from || dateRangeFilter?.to) && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setDateRangeFilter(undefined)
                      setPage(1)
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {notice && (
          <p
            className={cn(
              "mt-3 rounded-md border px-3 py-2 text-sm",
              notice.type === "error"
                ? "border-rose-300 bg-rose-50 text-rose-700"
                : notice.type === "info"
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-emerald-300 bg-emerald-50 text-emerald-700",
            )}
          >
            {notice.text}
          </p>
        )}

        <div className="mt-4 rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-16">Thumbnail</TableHead>
                <TableHead>Expo Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="whitespace-nowrap">Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedExpos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No expos match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                pagedExpos.map((expo) => (
                  <TableRow key={expo.id}>
                    <TableCell>
                      <Image
                        src={expo.thumbnailUrl}
                        alt={expo.name}
                        width={64}
                        height={48}
                        className="rounded-md border object-cover"
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/tradexpo/expos/${expo.id}`}
                        className="font-medium hover:underline"
                      >
                        {expo.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {expo.ownerEmail}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(expo.startDate)} – {formatDate(expo.endDate)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(statusStyles[expo.status])}
                      >
                        {expo.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon-sm" variant="ghost">
                            <MoreHorizontalIcon />
                            <span className="sr-only">Open actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/tradexpo/expos/${expo.id}`}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {expo.status === "Pending Review" && (
                            <DropdownMenuItem
                              onSelect={() =>
                                setConfirmAction({ type: "approve", expo })
                              }
                            >
                              Approve
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          {expo.status !== "Archived" && (
                            <DropdownMenuItem
                              onSelect={() =>
                                setConfirmAction({ type: "archive", expo })
                              }
                            >
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() =>
                              setConfirmAction({ type: "delete", expo })
                            }
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {filteredExpos.length === 0
              ? "No results"
              : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredExpos.length)} of ${filteredExpos.length}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span>
              Page {page}/{totalPages}
            </span>
            <Button
              size="xs"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </section>

      <AlertDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmMeta?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMeta?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmMeta?.variant}
              onClick={handleConfirm}
            >
              {confirmMeta?.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
