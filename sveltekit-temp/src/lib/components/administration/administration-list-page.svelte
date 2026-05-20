<script lang="ts">
import { AlertCircle, RefreshCw, Search } from "lucide-svelte"
import Badge from "$lib/components/ui/badge/badge.svelte"
import { Button } from "$lib/components/ui/button"
import Input from "$lib/components/ui/input/input.svelte"
import { Skeleton } from "$lib/components/ui/skeleton"
import * as Table from "$lib/components/ui/table"
import type {
  AdminFeature,
  AdminModule,
  AdminPermission,
  AdminRole,
  AdminUser,
  ListResponse,
  PaginationMeta
} from "$lib/administration/types"

type EntityType = "modules" | "roles" | "features" | "permissions" | "users"
type EntityRecord =
  | AdminModule
  | AdminRole
  | AdminFeature
  | AdminPermission
  | AdminUser

interface Props {
  entity: EntityType
  initialData?: ListResponse<EntityRecord>
  moduleOptions?: AdminModule[]
}

const PAGE_SIZE = 20
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
const skeletonRowKeys = [
  "skeleton-row-1",
  "skeleton-row-2",
  "skeleton-row-3",
  "skeleton-row-4",
  "skeleton-row-5",
  "skeleton-row-6"
]

function getInitialRows(input?: ListResponse<EntityRecord>) {
  return input?.data ?? []
}

function getInitialMeta(input?: ListResponse<EntityRecord>): PaginationMeta {
  return {
    page: input?.meta.page ?? 1,
    pageSize: PAGE_SIZE,
    totalItems: input?.meta.totalItems ?? 0,
    totalPages: input?.meta.totalPages ?? 1
  }
}

let props: Props = $props()
let entity = $derived(props.entity)
let moduleOptions = $derived(props.moduleOptions ?? [])
let rows = $state<EntityRecord[]>([])
let meta = $state<PaginationMeta>(getInitialMeta())
let searchInput = $state("")
let search = $state("")
let moduleFilter = $state("all")
let loading = $state(true)
let error = $state<string | null>(null)
let refreshKey = $state(0)
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let abortController: AbortController | undefined
let initialized = false

const showTabs = $derived(entity !== "modules" && entity !== "users")
const headers = $derived(TABLE_HEADERS[entity])
const columnCount = $derived(headers.length)

function isPermissionRecord(value: EntityRecord): value is AdminPermission {
  return "action" in value
}

function isUserRecord(value: EntityRecord): value is AdminUser {
  return "email" in value && "isActive" in value
}

function getUserInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return initials || "?"
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

async function loadRows() {
  abortController?.abort()
  const controller = new AbortController()
  abortController = controller
  loading = rows.length === 0
  error = null

  try {
    const params = new URLSearchParams({
      page: String(meta.page),
      pageSize: String(PAGE_SIZE),
      search,
      moduleId: moduleFilter,
      refresh: String(refreshKey)
    })
    const response = await fetch(`/api/administration/${entity}?${params}`, {
      cache: "default",
      signal: controller.signal
    })

    if (!response.ok) throw new Error("Unable to load data")

    const payload = (await response.json()) as ListResponse<EntityRecord>
    if (abortController === controller) {
      rows = payload.data
      meta = payload.meta
    }
  } catch (fetchError) {
    const isAbort =
      fetchError instanceof DOMException && fetchError.name === "AbortError"
    if (!isAbort) error = "Failed to load data. Please try again."
  } finally {
    if (abortController === controller) loading = false
  }
}

function handleSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    search = searchInput
    meta = { ...meta, page: 1 }
  }, 250)
}

function setModuleFilter(value: string) {
  moduleFilter = value
  meta = { ...meta, page: 1 }
}

function previousPage() {
  meta = { ...meta, page: meta.page - 1 }
}

function nextPage() {
  meta = { ...meta, page: meta.page + 1 }
}

function retry() {
  refreshKey += 1
}

$effect(() => {
  if (!initialized) {
    rows = getInitialRows(props.initialData)
    meta = getInitialMeta(props.initialData)
    loading = !props.initialData
    initialized = true
    if (props.initialData) return
  }

  entity
  meta.page
  moduleFilter
  refreshKey
  search
  loadRows()
})
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-center justify-between gap-3">
    {#if showTabs}
      <div class="flex flex-wrap gap-2 rounded-lg bg-muted p-1">
        <Button
          type="button"
          variant={moduleFilter === "all" ? "secondary" : "ghost"}
          size="sm"
          onclick={() => setModuleFilter("all")}
        >
          All
        </Button>
        {#each moduleOptions as moduleItem}
          <Button
            type="button"
            variant={moduleFilter === moduleItem.id ? "secondary" : "ghost"}
            size="sm"
            onclick={() => setModuleFilter(moduleItem.id)}
          >
            {moduleItem.name}
          </Button>
        {/each}
      </div>
    {:else}
      <div></div>
    {/if}

    <div class="relative w-full md:w-xs">
      <Input
        bind:value={searchInput}
        class="rounded-full pr-9"
        placeholder={`Search ${TITLES[entity].toLowerCase()}...`}
        oninput={handleSearchInput}
      />
      <Search class="-translate-y-1/2 absolute top-1/2 right-3 size-4 text-muted-foreground" />
    </div>
  </div>

  {#if error}
    <div class="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <p class="text-sm">{error}</p>
      <Button class="mt-3" variant="outline" onclick={retry}>
        <RefreshCw />
        Retry
      </Button>
    </div>
  {:else}
    <div class="overflow-hidden rounded-2xl border">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            {#each headers as header}
              <Table.Head>{header}</Table.Head>
            {/each}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#if loading}
            {#each skeletonRowKeys as rowKey}
              <Table.Row>
                {#each headers as header}
                  <Table.Cell>
                    <Skeleton class="h-5 w-full max-w-52" />
                  </Table.Cell>
                {/each}
              </Table.Row>
            {/each}
          {:else if rows.length === 0}
            <Table.Row>
              <Table.Cell
                colspan={columnCount}
                class="py-12 text-center text-muted-foreground"
              >
                <AlertCircle class="mx-auto mb-2 size-8 opacity-40" />
                {EMPTY_COPY[entity]}
              </Table.Cell>
            </Table.Row>
          {:else if entity === "modules"}
            {#each rows as record}
              {@const moduleRecord = record as AdminModule}
              <Table.Row>
                <Table.Cell>{moduleRecord.name}</Table.Cell>
                <Table.Cell class="font-mono text-xs">{moduleRecord.code}</Table.Cell>
                <Table.Cell>{moduleRecord.description}</Table.Cell>
              </Table.Row>
            {/each}
          {:else if entity === "users"}
            {#each rows.filter(isUserRecord) as user}
              <Table.Row>
                <Table.Cell>
                  <a
                    aria-label={`View details for ${user.name}`}
                    class="flex w-fit items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    href={`/admin/administration/users/${user.id}`}
                  >
                    <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-xs">
                      {getUserInitials(user.name)}
                    </span>
                    <div class="flex flex-col">
                      <span class="font-medium hover:underline">{user.name}</span>
                      <span class="text-muted-foreground text-xs">{user.email}</span>
                    </div>
                  </a>
                </Table.Cell>
                <Table.Cell>{user.companyName ?? "—"}</Table.Cell>
                <Table.Cell>{user.roleCount}</Table.Cell>
                <Table.Cell>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            {/each}
          {:else if entity === "permissions"}
            {#each rows.filter(isPermissionRecord) as permission}
              <Table.Row>
                <Table.Cell>{permission.name}</Table.Cell>
                <Table.Cell class="font-mono text-xs">{permission.id}</Table.Cell>
                <Table.Cell>
                  {permission.roleName} can {permission.action} {permission.featureName} in {permission.moduleName}.
                </Table.Cell>
              </Table.Row>
            {/each}
          {:else}
            {#each rows.filter(isRecordWithModuleName).filter(isRecordWithDescription) as record}
              <Table.Row>
                <Table.Cell>{record.name}</Table.Cell>
                <Table.Cell>{record.moduleName}</Table.Cell>
                <Table.Cell>{record.description}</Table.Cell>
              </Table.Row>
            {/each}
          {/if}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}

  <div class="flex items-center justify-between text-muted-foreground text-sm">
    <span>
      {meta.totalItems} item{meta.totalItems === 1 ? "" : "s"} total
    </span>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={meta.page <= 1 || loading}
        onclick={previousPage}
      >
        Previous
      </Button>
      <span>{meta.page} / {meta.totalPages}</span>
      <Button
        variant="outline"
        size="sm"
        disabled={meta.page >= meta.totalPages || loading}
        onclick={nextPage}
      >
        Next
      </Button>
    </div>
  </div>
</div>
