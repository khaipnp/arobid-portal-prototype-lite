import { randomUUID } from "node:crypto"
import { sql } from "$lib/db/neon"
import { ensurePlatformSchema } from "$lib/platform/ensure-schema"

export type PlanTargetType = "ORGANIZATION" | "EXPO"
export type PackagePlanValidityType = "DURATION" | "EVENT_BOUND"

export type PlanOption = {
  id: string
  code: string
  name: string
  targetType: PlanTargetType
  tierRank: number
  isActive: boolean
}

export type RoleOption = {
  id: string
  name: string
}

export type ExpoOption = {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
}

export type PackagePlanDefinition = {
  id: string
  planId: string
  planCode: string
  planName: string
  planTargetType: PlanTargetType
  planIsActive: boolean
  roleCode: string
  roleName: string
  validityType: PackagePlanValidityType
  durationMonths: number | null
  expoId: string | null
  expoName: string | null
  expoStatus: string | null
}

export type PackageDefinition = {
  id: string
  code: string
  name: string
  description: string
  price: number
  priceUnit: string
  imageUrl: string
  isPublic: boolean
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  plans: PackagePlanDefinition[]
  warnings: string[]
}

export type PackageDefinitionWorkspace = {
  packages: PackageDefinition[]
  plans: PlanOption[]
  roles: RoleOption[]
  expos: ExpoOption[]
  totals: {
    active: number
    inactive: number
    packagePlans: number
    eventBound: number
  }
}

export type PackageDefinitionDetailWorkspace = {
  package: PackageDefinition
  plans: PlanOption[]
  roles: RoleOption[]
  expos: ExpoOption[]
  totals: {
    packagePlans: number
    eventBound: number
    warnings: number
  }
}

export type PackagePlanInput = {
  planId: string
  roleCode: string
  validityType: PackagePlanValidityType
  durationMonths?: number | null
  expoId?: string | null
}

export type PackageDefinitionInput = {
  code: string
  name: string
  description?: string | null
  price?: number | null
  priceUnit?: string | null
  imageUrl?: string | null
  isPublic?: boolean
  isActive?: boolean
  plans: PackagePlanInput[]
}

type PackageRow = {
  id: string
  code: string
  name: string
  description: string | null
  price: string | number
  priceUnit: string
  imageUrl: string | null
  isPublic: boolean
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

type PackagePlanRow = PackagePlanDefinition & {
  packageId: string
}

function normalizeCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
}

function validatePackageBasics(input: PackageDefinitionInput) {
  const code = normalizeCode(input.code)
  const name = input.name.trim()
  const price = Number(input.price ?? 0)
  const priceUnit = (input.priceUnit ?? "VND").trim().toUpperCase()
  if (!code) throw new Error("Package code is required.")
  if (!name) throw new Error("Package name is required.")
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Package price must be zero or greater.")
  }
  if (!priceUnit) throw new Error("Package currency is required.")
  if (input.isActive !== false && input.plans.length === 0) {
    throw new Error("Package must contain at least one Plan.")
  }
  return {
    code,
    name,
    description: input.description?.trim() ?? "",
    price,
    priceUnit,
    imageUrl: input.imageUrl?.trim() ?? "",
    isPublic: input.isPublic === true
  }
}

async function validatePackagePlans(inputPlans: PackagePlanInput[]) {
  if (inputPlans.length === 0) return []

  const planRows = (await sql`
    select
      id,
      code,
      name,
      target_type as "targetType",
      tier_rank as "tierRank",
      is_active as "isActive"
    from plans
    where id = any(${inputPlans.map((plan) => plan.planId)})
  `) as PlanOption[]
  const plansById = new Map(planRows.map((plan) => [plan.id, plan]))
  const seen = new Set<string>()

  return inputPlans.map((entry) => {
    const plan = plansById.get(entry.planId)
    if (!plan) throw new Error("Selected plan does not exist.")
    if (!entry.roleCode) throw new Error("Role is required for every plan.")

    const duplicateKey = `${entry.planId}:${entry.roleCode}`
    if (seen.has(duplicateKey)) {
      throw new Error("Duplicate package plan for the same plan and role.")
    }
    seen.add(duplicateKey)

    if (entry.validityType === "DURATION") {
      const durationMonths = Number(entry.durationMonths)
      if (!Number.isFinite(durationMonths) || durationMonths <= 0) {
        throw new Error("DURATION plans require duration_months.")
      }
      if (entry.expoId) {
        throw new Error("DURATION plans must not have expo_id.")
      }
      if (plan.targetType !== "ORGANIZATION") {
        throw new Error("DURATION requires ORGANIZATION plan.")
      }
      return {
        ...entry,
        durationMonths: Math.trunc(durationMonths),
        expoId: null
      }
    }

    if (!entry.expoId) {
      throw new Error("EVENT_BOUND plans require expo_id.")
    }
    if (entry.durationMonths) {
      throw new Error("EVENT_BOUND plans must not have duration_months.")
    }
    if (plan.targetType !== "EXPO") {
      throw new Error("EVENT_BOUND requires EXPO plan.")
    }
    return {
      ...entry,
      durationMonths: null,
      expoId: entry.expoId
    }
  })
}

async function packageHasAssignments(packageId: string) {
  const exists = (await sql`
    select exists (
      select 1
      from information_schema.tables
      where table_name = 'package_assignments'
    ) as exists
  `) as { exists: boolean }[]
  if (!exists[0]?.exists) return false

  const rows = (await sql`
    select 1
    from package_assignments
    where package_id = ${packageId}
    limit 1
  `) as { "?column?": number }[]
  return rows.length > 0
}

function buildWarnings(plans: PackagePlanDefinition[]) {
  const warnings: string[] = []
  for (const plan of plans) {
    if (!plan.planIsActive) {
      warnings.push(`${plan.planCode} is inactive.`)
    }
    if (plan.validityType === "EVENT_BOUND" && plan.expoStatus !== "active") {
      warnings.push(`${plan.expoName ?? "Linked expo"} is not active.`)
    }
  }
  return warnings
}

function composePackages(rows: PackageRow[], planRows: PackagePlanRow[]) {
  const plansByPackage = new Map<string, PackagePlanDefinition[]>()
  for (const plan of planRows) {
    const current = plansByPackage.get(plan.packageId) ?? []
    current.push(plan)
    plansByPackage.set(plan.packageId, current)
  }

  return rows.map((row) => {
    const plans = plansByPackage.get(row.id) ?? []
    return {
      ...row,
      description: row.description ?? "",
      price: Number(row.price),
      imageUrl: row.imageUrl ?? "",
      plans,
      warnings: buildWarnings(plans)
    }
  })
}

async function getPackageDefinitionOptions() {
  const plans = (await sql`
    select
      id,
      code,
      name,
      target_type as "targetType",
      tier_rank as "tierRank",
      is_active as "isActive"
    from plans
    order by target_type asc, tier_rank asc, name asc
  `) as PlanOption[]

  const roles = (await sql`
    select id, name
    from roles
    order by name asc
  `) as RoleOption[]

  const expos = (await sql`
    select
      id,
      name,
      status,
      start_date as "startDate",
      end_date as "endDate"
    from expos
    order by start_date desc, name asc
  `) as ExpoOption[]

  return { plans, roles, expos }
}

async function getPackagePlanRows(packageId?: string) {
  return (await sql`
    select
      pp.id,
      pp.package_id as "packageId",
      pp.plan_id as "planId",
      p.code as "planCode",
      p.name as "planName",
      p.target_type as "planTargetType",
      p.is_active as "planIsActive",
      pp.role_code as "roleCode",
      r.name as "roleName",
      pp.validity_type as "validityType",
      pp.duration_months as "durationMonths",
      pp.expo_id as "expoId",
      e.name as "expoName",
      e.status as "expoStatus"
    from package_plans pp
    inner join plans p on p.id = pp.plan_id
    inner join roles r on r.id = pp.role_code
    left join expos e on e.id = pp.expo_id
    where ${packageId ?? null}::uuid is null or pp.package_id = ${packageId ?? null}
    order by pp.created_at asc
  `) as PackagePlanRow[]
}

export async function getPackageDefinitionWorkspace(): Promise<PackageDefinitionWorkspace> {
  await ensurePlatformSchema()

  const packageRows = (await sql`
    select
      id,
      code,
      name,
      description,
      price,
      price_unit as "priceUnit",
      image_url as "imageUrl",
      is_public as "isPublic",
      is_active as "isActive",
      created_by as "createdBy",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from packages
    order by updated_at desc, name asc
  `) as PackageRow[]

  const planRows = await getPackagePlanRows()
  const { plans, roles, expos } = await getPackageDefinitionOptions()
  const packages = composePackages(packageRows, planRows)
  return {
    packages,
    plans,
    roles,
    expos,
    totals: {
      active: packages.filter((pkg) => pkg.isActive).length,
      inactive: packages.filter((pkg) => !pkg.isActive).length,
      packagePlans: planRows.length,
      eventBound: planRows.filter((plan) => plan.validityType === "EVENT_BOUND")
        .length
    }
  }
}

export async function getPackageDefinition(packageId: string) {
  await ensurePlatformSchema()

  const packageRows = (await sql`
    select
      id,
      code,
      name,
      description,
      price,
      price_unit as "priceUnit",
      image_url as "imageUrl",
      is_public as "isPublic",
      is_active as "isActive",
      created_by as "createdBy",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from packages
    where id = ${packageId}
  `) as PackageRow[]

  if (packageRows.length === 0) return null

  const planRows = await getPackagePlanRows(packageId)
  return composePackages(packageRows, planRows)[0] ?? null
}

export async function getPackageDefinitionDetailWorkspace(
  packageId: string
): Promise<PackageDefinitionDetailWorkspace | null> {
  const pkg = await getPackageDefinition(packageId)
  if (!pkg) return null

  const { plans, roles, expos } = await getPackageDefinitionOptions()

  return {
    package: pkg,
    plans,
    roles,
    expos,
    totals: {
      packagePlans: pkg.plans.length,
      eventBound: pkg.plans.filter(
        (plan) => plan.validityType === "EVENT_BOUND"
      ).length,
      warnings: pkg.warnings.length
    }
  }
}

export async function createPackageDefinition(
  userId: string,
  input: PackageDefinitionInput
) {
  await ensurePlatformSchema()
  const basics = validatePackageBasics(input)
  const plans = await validatePackagePlans(input.plans)
  const packageId = randomUUID()

  await sql`begin`
  try {
    await sql`
      insert into packages (
        id,
        code,
        name,
        description,
        price,
        price_unit,
        image_url,
        is_public,
        is_active,
        created_by
      )
      values (
        ${packageId},
        ${basics.code},
        ${basics.name},
        ${basics.description},
        ${basics.price},
        ${basics.priceUnit},
        ${basics.imageUrl || null},
        ${basics.isPublic},
        ${input.isActive !== false},
        ${userId}
      )
    `

    for (const plan of plans) {
      await sql`
        insert into package_plans (
          id,
          package_id,
          plan_id,
          role_code,
          validity_type,
          duration_months,
          expo_id
        )
        values (
          ${randomUUID()},
          ${packageId},
          ${plan.planId},
          ${plan.roleCode},
          ${plan.validityType},
          ${plan.durationMonths},
          ${plan.expoId}
        )
      `
    }
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }

  return getPackageDefinitionWorkspace()
}

export async function updatePackageDefinition(
  packageId: string,
  input: PackageDefinitionInput
) {
  await ensurePlatformSchema()
  const basics = validatePackageBasics(input)
  const plans = await validatePackagePlans(input.plans)
  if (await packageHasAssignments(packageId)) {
    throw new Error("Cannot modify purchased Package plans.")
  }

  await sql`begin`
  try {
    await sql`
      update packages
      set
        code = ${basics.code},
        name = ${basics.name},
        description = ${basics.description},
        price = ${basics.price},
        price_unit = ${basics.priceUnit},
        image_url = ${basics.imageUrl || null},
        is_public = ${basics.isPublic},
        is_active = ${input.isActive !== false},
        updated_at = now()
      where id = ${packageId}
    `
    await sql`delete from package_plans where package_id = ${packageId}`
    for (const plan of plans) {
      await sql`
        insert into package_plans (
          id,
          package_id,
          plan_id,
          role_code,
          validity_type,
          duration_months,
          expo_id
        )
        values (
          ${randomUUID()},
          ${packageId},
          ${plan.planId},
          ${plan.roleCode},
          ${plan.validityType},
          ${plan.durationMonths},
          ${plan.expoId}
        )
      `
    }
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }

  return getPackageDefinitionWorkspace()
}

export async function setPackageActive(packageId: string, isActive: boolean) {
  await ensurePlatformSchema()
  if (isActive) {
    const rows = (await sql`
      select count(*)::int as count
      from package_plans
      where package_id = ${packageId}
    `) as { count: number }[]
    if (Number(rows[0]?.count ?? 0) === 0) {
      throw new Error("Package must contain at least one Plan.")
    }
  }

  await sql`
    update packages
    set is_active = ${isActive}, updated_at = now()
    where id = ${packageId}
  `
  return getPackageDefinitionWorkspace()
}
