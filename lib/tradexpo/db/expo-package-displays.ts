import { randomUUID } from "node:crypto"
import { sql } from "@/lib/db/neon"
import {
  createPackageDefinitionInCurrentTransaction,
  ensurePackageExpoPlanInCurrentTransaction,
  getPackageDefinitionOptions,
  getPackageDefinitionWorkspace
} from "@/lib/plan-subscriptions/db"
import { validateExpoPackageInputs } from "@/lib/tradexpo/expo-package-displays"
import type {
  ExpoPackageDisplay,
  ExpoPackageDisplaySource,
  ExpoPackageFormWorkspace,
  ExpoPackageInput,
  ExpoPackagePlanOption,
  ExpoPackageRoleOption
} from "@/lib/tradexpo/types"

const SELLER_ROLE_IDS = new Set(["seller", "exhibitor"])

type ExpoPackageDisplayRow = {
  id: string
  expo_id: string
  package_definition_id: string
  source: ExpoPackageDisplaySource
  name: string
  description: string
  price: string | number
  price_unit: string
  benefits: unknown
  is_featured: boolean
  is_public: boolean
  sort_order: number
  created_at: string | Date
  updated_at: string | Date
}

function rowToPackageDisplay(row: ExpoPackageDisplayRow): ExpoPackageDisplay {
  return {
    id: row.id,
    expoId: row.expo_id,
    packageDefinitionId: row.package_definition_id,
    source: row.source,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    priceUnit: row.price_unit,
    benefits: Array.isArray(row.benefits)
      ? row.benefits.filter((item): item is string => typeof item === "string")
      : [],
    isFeatured: row.is_featured,
    isPublic: row.is_public,
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  }
}

function packageCode(expoId: string, name: string, index: number) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
  return `expo_${expoId.replace(/[^a-z0-9]+/g, "_").slice(0, 16)}_${normalized || "package"}_${index + 1}_${randomUUID().slice(0, 8)}`
}

function findDefaultExpoPlan(plans: ExpoPackagePlanOption[]) {
  return plans
    .filter((plan) => plan.targetType === "EXPO" && plan.isActive)
    .sort((a, b) => a.tierRank - b.tierRank || a.name.localeCompare(b.name))[0]
}

function findDefaultSellerRole(roles: ExpoPackageRoleOption[]) {
  return (
    roles.find((role) => SELLER_ROLE_IDS.has(role.id)) ??
    roles.find((role) => /seller|exhibitor/i.test(role.name))
  )
}

function resolvePlanRole(
  pkg: ExpoPackageInput,
  workspace: ExpoPackageFormWorkspace
) {
  const advancedPlan = pkg.advanced?.planId
    ? workspace.plans.find((plan) => plan.id === pkg.advanced?.planId)
    : null
  const advancedRole = pkg.advanced?.roleCode
    ? workspace.roles.find((role) => role.id === pkg.advanced?.roleCode)
    : null
  const plan = advancedPlan ?? findDefaultExpoPlan(workspace.plans)
  const role = advancedRole ?? findDefaultSellerRole(workspace.roles)

  if (!plan) throw new Error("Advanced plan must target EXPO.")
  if (plan.targetType !== "EXPO") {
    throw new Error("Advanced plan must target EXPO.")
  }
  if (!role) throw new Error("Inline package requires seller/exhibitor role.")

  return { planId: plan.id, roleCode: role.id }
}

async function packageHasExpoBinding(packageId: string, expoId: string) {
  const rows = (await sql`
    select 1
    from package_plans pp
    inner join plans p on p.id = pp.plan_id
    where pp.package_id = ${packageId}
      and pp.expo_id = ${expoId}
      and pp.validity_type = 'EVENT_BOUND'
      and p.target_type = 'EXPO'
    limit 1
  `) as { "?column?": number }[]
  return rows.length > 0
}

export async function getExpoPackageFormWorkspace(): Promise<ExpoPackageFormWorkspace> {
  const workspace = await getPackageDefinitionWorkspace()
  const options = await getPackageDefinitionOptions()
  return {
    packages: workspace.packages,
    plans: options.plans,
    roles: options.roles
  }
}

export async function listExpoPackageDisplays(
  expoId: string
): Promise<ExpoPackageDisplay[]> {
  const rows = (await sql`
    select *
    from expo_package_displays
    where expo_id = ${expoId}
    order by sort_order asc, created_at asc
  `) as ExpoPackageDisplayRow[]
  return rows.map(rowToPackageDisplay)
}

export async function listPublicExpoPackageDisplays(
  expoId: string
): Promise<ExpoPackageDisplay[]> {
  const rows = (await sql`
    select *
    from expo_package_displays
    where expo_id = ${expoId} and is_public = true
    order by sort_order asc, created_at asc
  `) as ExpoPackageDisplayRow[]
  return rows.map(rowToPackageDisplay)
}

export async function saveExpoPackageDisplays(
  expoId: string,
  input: unknown,
  userId: string
): Promise<void> {
  const parsed = validateExpoPackageInputs(input)
  if (!parsed.ok) throw new Error(parsed.error)

  const workspace = await getExpoPackageFormWorkspace()
  const packageIds = new Set(workspace.packages.map((pkg) => pkg.id))
  const currentDisplays = await listExpoPackageDisplays(expoId)
  const currentById = new Map(
    currentDisplays.map((display) => [display.id, display])
  )
  const keepIds: string[] = []

  for (const [index, pkg] of parsed.packages.entries()) {
    let packageDefinitionId = pkg.packageDefinitionId
    const current = pkg.id ? currentById.get(pkg.id) : undefined
    let source: ExpoPackageDisplaySource =
      current && current.packageDefinitionId === packageDefinitionId
        ? current.source
        : "linked"

    if (pkg.mode === "create_new") {
      const { planId, roleCode } = resolvePlanRole(pkg, workspace)
      packageDefinitionId = await createPackageDefinitionInCurrentTransaction(
        userId,
        {
          code: packageCode(expoId, pkg.name, index),
          name: pkg.name,
          description: pkg.description ?? "",
          price: pkg.price,
          priceUnit: pkg.priceUnit,
          imageUrl: "",
          isPublic: pkg.isPublic,
          isActive: true,
          plans: [
            {
              planId,
              roleCode,
              validityType: "EVENT_BOUND",
              durationMonths: null,
              expoId
            }
          ]
        }
      )
      source = "inline_created"
    } else if (!packageDefinitionId || !packageIds.has(packageDefinitionId)) {
      throw new Error("Selected package does not exist.")
    } else if (!(await packageHasExpoBinding(packageDefinitionId, expoId))) {
      const { planId, roleCode } = resolvePlanRole(pkg, workspace)
      await ensurePackageExpoPlanInCurrentTransaction(packageDefinitionId, {
        planId,
        roleCode,
        expoId
      })
    }

    if (!packageDefinitionId)
      throw new Error("Selected package does not exist.")

    const displayId = pkg.id ?? `expo-package-${randomUUID()}`
    keepIds.push(displayId)

    await sql`
      insert into expo_package_displays (
        id,
        expo_id,
        package_definition_id,
        source,
        name,
        description,
        price,
        price_unit,
        benefits,
        is_featured,
        is_public,
        sort_order,
        created_at,
        updated_at
      )
      values (
        ${displayId},
        ${expoId},
        ${packageDefinitionId},
        ${source},
        ${pkg.name},
        ${pkg.description ?? ""},
        ${pkg.price},
        ${pkg.priceUnit},
        ${JSON.stringify(pkg.benefits)}::jsonb,
        ${pkg.isFeatured},
        ${pkg.isPublic},
        ${index},
        now(),
        now()
      )
      on conflict (id) do update
      set
        package_definition_id = excluded.package_definition_id,
        source = excluded.source,
        name = excluded.name,
        description = excluded.description,
        price = excluded.price,
        price_unit = excluded.price_unit,
        benefits = excluded.benefits,
        is_featured = excluded.is_featured,
        is_public = excluded.is_public,
        sort_order = excluded.sort_order,
        updated_at = now()
      where expo_package_displays.expo_id = ${expoId}
    `
  }

  if (keepIds.length === 0) {
    await sql`delete from expo_package_displays where expo_id = ${expoId}`
    return
  }

  await sql`
    delete from expo_package_displays
    where expo_id = ${expoId}
      and not (id = any(${keepIds}))
  `
}
