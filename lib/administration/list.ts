import {
  adminFeatures,
  adminModules,
  adminPermissions,
  adminRoles,
} from "@/lib/administration/mock-data"
import type {
  AdminFeature,
  AdminModule,
  AdminPermission,
  AdminRole,
  ListResponse,
} from "@/lib/administration/types"

export type AdministrationEntity =
  | "modules"
  | "roles"
  | "features"
  | "permissions"

export type AdministrationRecord =
  | AdminModule
  | AdminRole
  | AdminFeature
  | AdminPermission

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function listByEntity(entity: AdministrationEntity): AdministrationRecord[] {
  if (entity === "modules") return [...adminModules]
  if (entity === "roles") return [...adminRoles]
  if (entity === "features") return [...adminFeatures]
  return [...adminPermissions]
}

export function getAdministrationList(input: {
  entity: AdministrationEntity
  page?: number | string | null
  pageSize?: number | string | null
  search?: string | null
  moduleId?: string | null
}): ListResponse<AdministrationRecord> {
  const page =
    typeof input.page === "number"
      ? input.page
      : parsePositiveInt(input.page ?? null, 1)
  const pageSize =
    typeof input.pageSize === "number"
      ? input.pageSize
      : parsePositiveInt(input.pageSize ?? null, 20)
  const search = (input.search ?? "").trim().toLowerCase()
  const moduleId = input.moduleId ?? "all"

  const records = listByEntity(input.entity)
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((item) =>
      moduleId === "all" || !("moduleId" in item)
        ? true
        : item.moduleId === moduleId,
    )
    .filter((item) =>
      search.length === 0 ? true : item.name.toLowerCase().includes(search),
    )

  const totalItems = records.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize

  return {
    data: records.slice(start, start + pageSize),
    meta: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
    },
  }
}
