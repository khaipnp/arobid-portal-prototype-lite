import {
  adminFeatures,
  adminModules,
  adminPermissions,
  adminRoles
} from "@/lib/administration/mock-data"
import type {
  AdminFeature,
  AdminModule,
  AdminPermission,
  AdminRole,
  ListResponse
} from "@/lib/administration/types"
import { sql } from "@/lib/db/neon"

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

type CountRow = { count: number }

let administrationSchemaReady = false

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

async function ensureAdministrationSchema() {
  if (administrationSchemaReady) return

  await sql`
    create table if not exists admin_modules (
      id text primary key,
      name text not null,
      code text not null unique,
      description text not null
    )
  `
  await sql`
    create table if not exists admin_roles (
      id text primary key,
      name text not null,
      module_id text not null references admin_modules(id) on delete cascade,
      description text not null
    )
  `
  await sql`
    create table if not exists admin_features (
      id text primary key,
      name text not null,
      module_id text not null references admin_modules(id) on delete cascade,
      description text not null
    )
  `
  await sql`
    create table if not exists admin_permissions (
      id text primary key,
      name text not null,
      module_id text not null references admin_modules(id) on delete cascade,
      role_id text not null references admin_roles(id) on delete cascade,
      feature_id text not null references admin_features(id) on delete cascade,
      action text not null
    )
  `

  await sql`
    create index if not exists idx_admin_roles_module_id
    on admin_roles (module_id)
  `
  await sql`
    create index if not exists idx_admin_features_module_id
    on admin_features (module_id)
  `
  await sql`
    create index if not exists idx_admin_permissions_module_id
    on admin_permissions (module_id)
  `

  for (const moduleItem of adminModules) {
    await sql`
      insert into admin_modules (id, name, code, description)
      values (${moduleItem.id}, ${moduleItem.name}, ${moduleItem.code}, ${moduleItem.description})
      on conflict (id) do nothing
    `
  }

  for (const role of adminRoles) {
    await sql`
      insert into admin_roles (id, name, module_id, description)
      values (${role.id}, ${role.name}, ${role.moduleId}, ${role.description})
      on conflict (id) do nothing
    `
  }

  for (const feature of adminFeatures) {
    await sql`
      insert into admin_features (id, name, module_id, description)
      values (${feature.id}, ${feature.name}, ${feature.moduleId}, ${feature.description})
      on conflict (id) do nothing
    `
  }

  for (const permission of adminPermissions) {
    await sql`
      insert into admin_permissions (id, name, module_id, role_id, feature_id, action)
      values (
        ${permission.id},
        ${permission.name},
        ${permission.moduleId},
        ${permission.roleId},
        ${permission.featureId},
        ${permission.action}
      )
      on conflict (id) do nothing
    `
  }

  administrationSchemaReady = true
}

export async function getAdministrationModules(): Promise<AdminModule[]> {
  await ensureAdministrationSchema()
  const rows = (await sql`
    select id, name, code, description
    from admin_modules
    order by name asc
  `) as AdminModule[]

  return rows
}

export async function getAdministrationList(input: {
  entity: AdministrationEntity
  page?: number | string | null
  pageSize?: number | string | null
  search?: string | null
  moduleId?: string | null
}): Promise<ListResponse<AdministrationRecord>> {
  await ensureAdministrationSchema()

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
  const searchPattern = `%${search}%`
  let totalItems = 0
  let records: AdministrationRecord[] = []

  if (input.entity === "modules") {
    const countRows = (await sql`
      select count(*)::int as count
      from admin_modules
      where lower(name) like ${searchPattern}
    `) as CountRow[]
    totalItems = Number(countRows[0]?.count ?? 0)
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize

    records = (await sql`
      select id, name, code, description
      from admin_modules
      where lower(name) like ${searchPattern}
      order by name asc
      limit ${pageSize} offset ${start}
    `) as AdminModule[]

    return {
      data: records,
      meta: {
        page: safePage,
        pageSize,
        totalItems,
        totalPages
      }
    }
  }

  if (input.entity === "roles") {
    const countRows = (await sql`
      select count(*)::int as count
      from admin_roles role
      where lower(role.name) like ${searchPattern}
        and (${moduleId} = 'all' or role.module_id = ${moduleId})
    `) as CountRow[]
    totalItems = Number(countRows[0]?.count ?? 0)
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize

    records = (await sql`
      select
        role.id,
        role.name,
        role.module_id as "moduleId",
        module.name as "moduleName",
        role.description
      from admin_roles role
      inner join admin_modules module on module.id = role.module_id
      where lower(role.name) like ${searchPattern}
        and (${moduleId} = 'all' or role.module_id = ${moduleId})
      order by role.name asc
      limit ${pageSize} offset ${start}
    `) as AdminRole[]

    return {
      data: records,
      meta: {
        page: safePage,
        pageSize,
        totalItems,
        totalPages
      }
    }
  }

  if (input.entity === "features") {
    const countRows = (await sql`
      select count(*)::int as count
      from admin_features feature
      where lower(feature.name) like ${searchPattern}
        and (${moduleId} = 'all' or feature.module_id = ${moduleId})
    `) as CountRow[]
    totalItems = Number(countRows[0]?.count ?? 0)
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize

    records = (await sql`
      select
        feature.id,
        feature.name,
        feature.module_id as "moduleId",
        module.name as "moduleName",
        feature.description
      from admin_features feature
      inner join admin_modules module on module.id = feature.module_id
      where lower(feature.name) like ${searchPattern}
        and (${moduleId} = 'all' or feature.module_id = ${moduleId})
      order by feature.name asc
      limit ${pageSize} offset ${start}
    `) as AdminFeature[]

    return {
      data: records,
      meta: {
        page: safePage,
        pageSize,
        totalItems,
        totalPages
      }
    }
  }

  const countRows = (await sql`
    select count(*)::int as count
    from admin_permissions permission
    where lower(permission.name) like ${searchPattern}
      and (${moduleId} = 'all' or permission.module_id = ${moduleId})
  `) as CountRow[]
  totalItems = Number(countRows[0]?.count ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize

  records = (await sql`
    select
      permission.id,
      permission.name,
      permission.module_id as "moduleId",
      module.name as "moduleName",
      permission.role_id as "roleId",
      role.name as "roleName",
      permission.feature_id as "featureId",
      feature.name as "featureName",
      permission.action
    from admin_permissions permission
    inner join admin_modules module on module.id = permission.module_id
    inner join admin_roles role on role.id = permission.role_id
    inner join admin_features feature on feature.id = permission.feature_id
    where lower(permission.name) like ${searchPattern}
      and (${moduleId} = 'all' or permission.module_id = ${moduleId})
    order by permission.name asc
    limit ${pageSize} offset ${start}
  `) as AdminPermission[]

  return {
    data: records,
    meta: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages
    }
  }
}
