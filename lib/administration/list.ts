import type {
  AdminFeature,
  AdminModule,
  AdminPermission,
  AdminRole,
  AdminUser,
  ListResponse
} from "@/lib/administration/types"
import { sql } from "@/lib/db/neon"

export type AdministrationEntity =
  | "modules"
  | "roles"
  | "features"
  | "permissions"
  | "users"

export type AdministrationRecord =
  | AdminModule
  | AdminRole
  | AdminFeature
  | AdminPermission
  | AdminUser

type CountRow = { count: number }
type UserStatusFilter = "all" | "active" | "inactive"

let administrationSchemaReady = false

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseUserStatusFilter(value: string | null): UserStatusFilter {
  return value === "active" || value === "inactive" ? value : "all"
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

  await sql`
    insert into admin_modules (id, name, code, description)
    values
      ('module-b2b', 'B2B Marketplace', 'B2B_MARKETPLACE', 'Core trading and supplier management features.'),
      ('module-tradexpo', 'TradeXpo', 'TRADEXPO', 'Expo and booth management capabilities.')
    on conflict (id) do update
    set
      name = excluded.name,
      code = excluded.code,
      description = excluded.description
  `

  await sql`
    insert into admin_roles (id, name, module_id, description)
    values
      ('role-sys-admin', 'SYS_ADMIN', 'module-b2b', 'Can switch portals and administer platform-wide settings.'),
      ('role-buyer', 'BUYER', 'module-b2b', 'Can discover and place orders for products.'),
      ('role-seller', 'SELLER', 'module-b2b', 'Can create and manage products and quotations.'),
      ('role-expo-owner', 'EXPO_OWNER', 'module-tradexpo', 'Can create and operate expo events.'),
      ('role-exhibitor', 'EXHIBITOR', 'module-tradexpo', 'Can participate in expo and manage booths.')
    on conflict (id) do update
    set
      name = excluded.name,
      module_id = excluded.module_id,
      description = excluded.description
  `

  await sql`
    insert into admin_features (id, name, module_id, description)
    values
      ('feature-order-management', 'Order Management', 'module-b2b', 'Track, review, and process platform orders.'),
      ('feature-catalog', 'Catalog', 'module-b2b', 'Manage product catalog entries and categories.'),
      ('feature-expo-list', 'Expo List', 'module-tradexpo', 'Create and administer expo records.'),
      ('feature-booth-template', 'Booth Templates', 'module-tradexpo', 'Configure reusable 3D booth templates.')
    on conflict (id) do update
    set
      name = excluded.name,
      module_id = excluded.module_id,
      description = excluded.description
  `

  await sql`
    insert into admin_permissions (id, name, module_id, role_id, feature_id, action)
    values
      ('order-read', 'Read Orders', 'module-b2b', 'role-buyer', 'feature-order-management', 'read'),
      ('order-create', 'Create Orders', 'module-b2b', 'role-buyer', 'feature-order-management', 'create'),
      ('catalog-edit', 'Edit Catalog', 'module-b2b', 'role-seller', 'feature-catalog', 'update'),
      ('expo-read', 'Read Expo', 'module-tradexpo', 'role-expo-owner', 'feature-expo-list', 'read'),
      ('expo-create', 'Create Expo', 'module-tradexpo', 'role-expo-owner', 'feature-expo-list', 'create'),
      ('booth-read', 'Read Booth Templates', 'module-tradexpo', 'role-exhibitor', 'feature-booth-template', 'read')
    on conflict (id) do update
    set
      name = excluded.name,
      module_id = excluded.module_id,
      role_id = excluded.role_id,
      feature_id = excluded.feature_id,
      action = excluded.action
  `

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
  status?: string | null
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
  const status = parseUserStatusFilter(input.status ?? null)
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

  if (input.entity === "users") {
    const countRows = (await sql`
      select count(*)::int as count
      from users app_user
      left join companies company on company.id = app_user.company_id
      where (
        lower(app_user.name) like ${searchPattern}
        or lower(app_user.email) like ${searchPattern}
        or lower(coalesce(company.name, '')) like ${searchPattern}
      )
        and (${status} = 'all'
          or (${status} = 'active' and app_user.is_active)
          or (${status} = 'inactive' and not app_user.is_active))
    `) as CountRow[]
    totalItems = Number(countRows[0]?.count ?? 0)
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize

    records = (await sql`
      select
        app_user.id,
        app_user.name,
        app_user.email,
        app_user.avatar_url as "avatarUrl",
        company.name as "companyName",
        company.logo_url as "companyLogoUrl",
        coalesce(role_counts.role_count, 0)::int as "roleCount",
        app_user.is_active as "isActive"
      from users app_user
      left join companies company on company.id = app_user.company_id
      left join (
        select user_id, count(*)::int as role_count
        from user_roles
        group by user_id
      ) role_counts on role_counts.user_id = app_user.id
      where (
        lower(app_user.name) like ${searchPattern}
        or lower(app_user.email) like ${searchPattern}
        or lower(coalesce(company.name, '')) like ${searchPattern}
      )
        and (${status} = 'all'
          or (${status} = 'active' and app_user.is_active)
          or (${status} = 'inactive' and not app_user.is_active))
      order by app_user.name asc, app_user.email asc
      limit ${pageSize} offset ${start}
    `) as AdminUser[]

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
