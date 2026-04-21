import { NextResponse } from "next/server"
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
} from "@/lib/administration/types"

type EntityType = "modules" | "roles" | "features" | "permissions"
type EntityRecord = AdminModule | AdminRole | AdminFeature | AdminPermission

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function sortByName<T extends EntityRecord>(items: T[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name))
}

function listByEntity(entity: EntityType): EntityRecord[] {
  if (entity === "modules") return sortByName(adminModules)
  if (entity === "roles") return sortByName(adminRoles)
  if (entity === "features") return sortByName(adminFeatures)
  return sortByName(adminPermissions)
}

function filterByModule<T extends EntityRecord>(items: T[], moduleId: string) {
  if (!moduleId || moduleId === "all") return items
  return items.filter(
    (item) => "moduleId" in item && item.moduleId === moduleId,
  )
}

function filterBySearch<T extends EntityRecord>(items: T[], search: string) {
  const keyword = search.trim().toLowerCase()
  if (!keyword) return items
  return items.filter((item) => item.name.toLowerCase().includes(keyword))
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { entity } = await params
  if (
    entity !== "modules" &&
    entity !== "roles" &&
    entity !== "features" &&
    entity !== "permissions"
  ) {
    return NextResponse.json({ error: "Entity not found." }, { status: 404 })
  }

  const url = new URL(request.url)
  const search = url.searchParams.get("search") ?? ""
  const moduleId = url.searchParams.get("moduleId") ?? "all"
  const page = parsePositiveInt(url.searchParams.get("page"), 1)
  const pageSize = parsePositiveInt(url.searchParams.get("pageSize"), 20)

  const records = filterBySearch(
    filterByModule(listByEntity(entity), moduleId),
    search,
  )

  const totalItems = records.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const data = records.slice(start, start + pageSize)

  return NextResponse.json({
    data,
    meta: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
    },
  })
}
