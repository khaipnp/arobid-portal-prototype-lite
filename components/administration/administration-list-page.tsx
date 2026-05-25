"use client"

import {
  AlertCircleIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  SearchIcon
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "@/components/user-avatar"
import type {
  AdminFeature,
  AdminModule,
  AdminPermission,
  AdminRole,
  AdminUser,
  ListResponse,
  PaginationMeta
} from "@/lib/administration/types"

type EntityType = "modules" | "roles" | "features" | "permissions" | "users"
type EntityRecord =
  | AdminModule
  | AdminRole
  | AdminFeature
  | AdminPermission
  | AdminUser

const PAGE_SIZE = 20

interface AdministrationListPageProps {
  entity: EntityType
  initialData?: ListResponse<EntityRecord>
  moduleOptions?: AdminModule[]
}

const TITLES: Record<EntityType, string> = {
  modules: "Modules",
  roles: "Roles",
  features: "Features",
  permissions: "Permissions",
  users: "Users"
}

const EMPTY_COPY: Record<EntityType, string> = {
  modules: "No modules found.",
  roles: "No roles found.",
  features: "No features found.",
  permissions: "No permissions found.",
  users: "No users found."
}

const TABLE_HEADERS: Record<EntityType, string[]> = {
  modules: ["Module", "Code", "Description"],
  roles: ["Role", "Module", "Description"],
  features: ["Feature", "Module", "Description"],
  permissions: ["Permission", "Permission Code", "Description"],
  users: ["Name", "Company", "Roles", "Status", "Actions"]
}

type RenderRowsOptions = {
  pendingUserId: string | null
  onUserDelete: (user: AdminUser) => void
  onUserPasswordReset: (user: AdminUser) => void
  onUserStatusToggle: (user: AdminUser) => void
}

function isPermissionRecord(value: EntityRecord): value is AdminPermission {
  return "action" in value
}

function isUserRecord(value: EntityRecord): value is AdminUser {
  return "email" in value && "isActive" in value
}

function isRecordWithModuleName(
  value: EntityRecord
): value is AdminRole | AdminFeature | AdminPermission {
  return "moduleName" in value
}

function isRecordWithDescription(
  value: AdminRole | AdminFeature | AdminPermission
): value is AdminRole | AdminFeature {
  return "description" in value
}

function getCompanyInitials(name: string | null) {
  const initials = (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return initials || "—"
}

function renderRows(
  entity: EntityType,
  data: EntityRecord[],
  options: RenderRowsOptions
) {
  if (entity === "modules") {
    return data.map((record) => {
      const moduleRecord = record as AdminModule
      return (
        <TableRow key={moduleRecord.id}>
          <TableCell>{moduleRecord.name}</TableCell>
          <TableCell className="font-mono text-xs">
            {moduleRecord.code}
          </TableCell>
          <TableCell>{moduleRecord.description}</TableCell>
        </TableRow>
      )
    })
  }

  if (entity === "users") {
    return data.filter(isUserRecord).map((user) => {
      const detailHref = `/admin/administration/users/${user.id}`
      const statusActionLabel = user.isActive ? "Inactive" : "Active"
      const statusPending = options.pendingUserId === user.id

      return (
        <TableRow key={user.id}>
          <TableCell>
            <Link
              aria-label={`View details for ${user.name}`}
              className="flex w-fit items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={detailHref}
            >
              <UserAvatar name={user.name} imageUrl={user.avatarUrl} />
              <div className="flex flex-col">
                <span className="font-medium hover:underline">{user.name}</span>
                <span className="text-muted-foreground text-xs">
                  {user.email}
                </span>
              </div>
            </Link>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                {user.companyLogoUrl ? (
                  <AvatarImage
                    src={user.companyLogoUrl}
                    alt={`${user.companyName ?? "Company"} logo`}
                  />
                ) : null}
                <AvatarFallback>
                  {getCompanyInitials(user.companyName)}
                </AvatarFallback>
              </Avatar>
              <span>{user.companyName ?? "—"}</span>
            </div>
          </TableCell>
          <TableCell>{user.roleCount}</TableCell>
          <TableCell>
            <Badge variant={user.isActive ? "default" : "secondary"}>
              {user.isActive ? "Active" : "Inactive"}
            </Badge>
          </TableCell>
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-sm" variant="ghost" disabled={statusPending}>
                  <MoreHorizontalIcon />
                  <span className="sr-only">Open actions for {user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem asChild>
                  <Link href={detailHref}>View detail</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={statusPending}
                  onSelect={() => options.onUserStatusToggle(user)}
                >
                  {statusPending ? "Updating..." : statusActionLabel}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => options.onUserPasswordReset(user)}
                >
                  Reset password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => options.onUserDelete(user)}
                >
                  Delete user
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      )
    })
  }

  if (entity === "permissions") {
    const permissionRecords = data.filter(isPermissionRecord)
    return permissionRecords.map((permission) => (
      <TableRow key={permission.id}>
        <TableCell>{permission.name}</TableCell>
        <TableCell className="font-mono text-xs">{permission.id}</TableCell>
        <TableCell>
          {`${permission.roleName} can ${permission.action} ${permission.featureName} in ${permission.moduleName}.`}
        </TableCell>
      </TableRow>
    ))
  }

  const records = data
    .filter(isRecordWithModuleName)
    .filter(isRecordWithDescription)
  return records.map((record) => (
    <TableRow key={record.id}>
      <TableCell>{record.name}</TableCell>
      <TableCell>{record.moduleName}</TableCell>
      <TableCell>{record.description}</TableCell>
    </TableRow>
  ))
}

export function AdministrationListPage({
  entity,
  initialData,
  moduleOptions = []
}: AdministrationListPageProps) {
  const [rows, setRows] = useState<EntityRecord[]>(initialData?.data ?? [])
  const [meta, setMeta] = useState<PaginationMeta>({
    page: initialData?.meta.page ?? 1,
    pageSize: PAGE_SIZE,
    totalItems: initialData?.meta.totalItems ?? 0,
    totalPages: initialData?.meta.totalPages ?? 1
  })
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [moduleFilter, setModuleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [passwordTarget, setPasswordTarget] = useState<AdminUser | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [resettingPassword, setResettingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput)
      setMeta((current) => ({ ...current, page: 1 }))
    }, 250)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const load = async () => {
      // Keep previous rows while loading the next result.
      setLoading(rows.length === 0)
      setError(null)
      try {
        const params = new URLSearchParams({
          page: String(meta.page),
          pageSize: String(PAGE_SIZE),
          search,
          moduleId: moduleFilter,
          status: entity === "users" ? statusFilter : "all",
          refresh: String(refreshKey)
        })
        const response = await fetch(
          `/api/administration/${entity}?${params}`,
          {
            cache: "default",
            signal: controller.signal
          }
        )
        if (!response.ok) {
          throw new Error("Unable to load data")
        }
        const payload = (await response.json()) as ListResponse<EntityRecord>
        if (!cancelled) {
          setRows(payload.data)
          setMeta(payload.meta)
        }
      } catch (fetchError) {
        if (!cancelled) {
          const isAbort =
            fetchError instanceof DOMException &&
            fetchError.name === "AbortError"
          if (!isAbort) {
            setError("Failed to load data. Please try again.")
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
  }, [
    entity,
    meta.page,
    moduleFilter,
    refreshKey,
    search,
    rows.length,
    statusFilter
  ])

  function handleSearchChange(value: string) {
    setSearchInput(value)
  }

  function handleModuleFilterChange(value: string) {
    setModuleFilter(value)
    setMeta((current) => ({ ...current, page: 1 }))
  }

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value)
    setMeta((current) => ({ ...current, page: 1 }))
  }

  async function handleUserStatusToggle(user: AdminUser) {
    setPendingUserId(user.id)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/administration/users/${encodeURIComponent(user.id)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !user.isActive })
        }
      )
      if (!response.ok) {
        throw new Error("Unable to update user status")
      }
      setRows((currentRows) =>
        currentRows.map((row) =>
          isUserRecord(row) && row.id === user.id
            ? { ...row, isActive: !user.isActive }
            : row
        )
      )
      if (statusFilter !== "all") {
        setRefreshKey((current) => current + 1)
      }
    } catch {
      setError("Failed to update user status. Please try again.")
    } finally {
      setPendingUserId(null)
    }
  }

  function openPasswordDialog(user: AdminUser) {
    setPasswordTarget(user)
    setNewPassword("")
    setConfirmPassword("")
    setPasswordError(null)
  }

  async function handlePasswordReset(event: { preventDefault: () => void }) {
    event.preventDefault()
    if (!passwordTarget) return

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Password confirmation does not match.")
      return
    }

    setResettingPassword(true)
    setPasswordError(null)

    try {
      const response = await fetch(
        `/api/admin/administration/users/${encodeURIComponent(passwordTarget.id)}/password`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: newPassword })
        }
      )
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to reset password")
      }
      setPasswordTarget(null)
      setNewPassword("")
      setConfirmPassword("")
    } catch (resetError) {
      setPasswordError(
        resetError instanceof Error
          ? resetError.message
          : "Failed to reset password. Please try again."
      )
    } finally {
      setResettingPassword(false)
    }
  }

  async function handleUserDelete() {
    if (!deleteTarget) return
    setDeletingUserId(deleteTarget.id)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/administration/users/${encodeURIComponent(deleteTarget.id)}`,
        { method: "DELETE" }
      )
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error ?? "Unable to delete user")
      }
      setRows((currentRows) =>
        currentRows.filter(
          (row) => !isUserRecord(row) || row.id !== deleteTarget.id
        )
      )
      setMeta((current) => ({
        ...current,
        totalItems: Math.max(0, current.totalItems - 1)
      }))
      setDeleteTarget(null)
      setRefreshKey((current) => current + 1)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete user. Please try again."
      )
    } finally {
      setDeletingUserId(null)
    }
  }

  function retry() {
    setRefreshKey((current) => current + 1)
  }

  const showTabs = entity !== "modules" && entity !== "users"
  const showStatusFilter = entity === "users"
  const headers = TABLE_HEADERS[entity]
  const columnCount = headers.length
  const skeletonRowKeys = [
    "skeleton-row-1",
    "skeleton-row-2",
    "skeleton-row-3",
    "skeleton-row-4",
    "skeleton-row-5",
    "skeleton-row-6"
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {showTabs ? (
          <Tabs value={moduleFilter} onValueChange={handleModuleFilterChange}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              {moduleOptions.map((moduleItem) => (
                <TabsTrigger key={moduleItem.id} value={moduleItem.id}>
                  {moduleItem.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : (
          <div />
        )}
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <InputGroup className="w-full rounded-full md:w-xs">
            <InputGroupInput
              value={searchInput}
              placeholder={`Search ${TITLES[entity].toLowerCase()}...`}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
          {showStatusFilter && (
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-full rounded-full md:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          )}
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
                {headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                skeletonRowKeys.map((rowKey) => (
                  <TableRow key={rowKey}>
                    {headers.map((header) => (
                      <TableCell key={`${rowKey}-${header}`}>
                        <Skeleton className="h-5 w-full max-w-52" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <AlertCircleIcon className="mx-auto mb-2 size-8 opacity-40" />
                    {EMPTY_COPY[entity]}
                  </TableCell>
                </TableRow>
              ) : (
                renderRows(entity, rows, {
                  pendingUserId,
                  onUserDelete: setDeleteTarget,
                  onUserPasswordReset: openPasswordDialog,
                  onUserStatusToggle: handleUserStatusToggle
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={Boolean(passwordTarget)}
        onOpenChange={(open) => {
          if (!open && !resettingPassword) {
            setPasswordTarget(null)
            setNewPassword("")
            setConfirmPassword("")
            setPasswordError(null)
          }
        }}
      >
        <DialogContent>
          <form className="space-y-4" onSubmit={handlePasswordReset}>
            <DialogHeader>
              <DialogTitle>Reset password</DialogTitle>
              <DialogDescription>
                Set a new password for {passwordTarget?.name ?? "this user"}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="admin-reset-password">New password</Label>
              <Input
                id="admin-reset-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                disabled={resettingPassword}
                minLength={8}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-reset-password-confirm">
                Confirm new password
              </Label>
              <Input
                id="admin-reset-password-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                disabled={resettingPassword}
                minLength={8}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
            {passwordError ? (
              <p className="text-destructive text-sm">{passwordError}</p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={resettingPassword}
                onClick={() => {
                  setPasswordTarget(null)
                  setNewPassword("")
                  setConfirmPassword("")
                  setPasswordError(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={resettingPassword}>
                {resettingPassword ? "Resetting..." : "Reset password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deletingUserId) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.name ?? "this user"}{" "}
              and related access records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingUserId)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={Boolean(deletingUserId)}
              onClick={(event) => {
                event.preventDefault()
                void handleUserDelete()
              }}
            >
              {deletingUserId ? "Deleting..." : "Delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-wrap items-center justify-between gap-3 text-muted-foreground text-sm">
        <span>
          {meta.totalItems} item{meta.totalItems === 1 ? "" : "s"} total
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
