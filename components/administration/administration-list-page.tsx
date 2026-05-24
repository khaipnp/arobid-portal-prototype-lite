"use client"

import {
  AlertCircleIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  SearchIcon
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from "@/components/ui/input-group"
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
  users: ["Name", "Company", "Roles", "Status"]
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

function renderRows(entity: EntityType, data: EntityRecord[]) {
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
    return data.filter(isUserRecord).map((user) => (
      <TableRow key={user.id}>
        <TableCell>
          <Link
            aria-label={`View details for ${user.name}`}
            className="flex w-fit items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href={`/admin/administration/users/${user.id}`}
          >
            <UserAvatar name={user.name} />
            <div className="flex flex-col">
              <span className="font-medium hover:underline">{user.name}</span>
              <span className="text-muted-foreground text-xs">
                {user.email}
              </span>
            </div>
          </Link>
        </TableCell>
        <TableCell>{user.companyName ?? "—"}</TableCell>
        <TableCell>{user.roleCount}</TableCell>
        <TableCell>
          <Badge variant={user.isActive ? "default" : "secondary"}>
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
        </TableCell>
      </TableRow>
    ))
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
  }, [entity, meta.page, moduleFilter, refreshKey, search, rows.length])

  function handleSearchChange(value: string) {
    setSearchInput(value)
  }

  function handleModuleFilterChange(value: string) {
    setModuleFilter(value)
    setMeta((current) => ({ ...current, page: 1 }))
  }

  function retry() {
    setRefreshKey((current) => current + 1)
  }

  const showTabs = entity !== "modules" && entity !== "users"
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
                renderRows(entity, rows)
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <span>
          {meta.totalItems} item{meta.totalItems === 1 ? "" : "s"} total
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 1 || loading}
            onClick={() =>
              setMeta((current) => ({ ...current, page: current.page - 1 }))
            }
          >
            Previous
          </Button>
          <span>
            {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.totalPages || loading}
            onClick={() =>
              setMeta((current) => ({ ...current, page: current.page + 1 }))
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
