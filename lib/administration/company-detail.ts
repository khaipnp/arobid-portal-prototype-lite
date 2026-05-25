import type { CompanyCategoryOption } from "@/lib/administration/types"
import { sql } from "@/lib/db/neon"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export interface AdministrationCompanyAccount {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  isActive: boolean
  roleIds: string[]
}

export interface AdministrationCompanyDetail {
  id: string
  name: string
  taxId: string | null
  logoUrl: string | null
  website: string | null
  address: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  representativeUserId: string | null
  categoryIds: string[]
  categoryNames: string[]
  userCount: number
  productCount: number
  representativeAccount: AdministrationCompanyAccount | null
  userAccounts: AdministrationCompanyAccount[]
}

export interface UpdateAdministrationCompanyInput {
  companyId: string
  name: string
  taxId: string | null
  logoUrl: string | null
  website: string | null
  address: string | null
  isActive: boolean
  categoryIds: string[]
  representativeUserId: string | null
}

type CompanyRow = Omit<
  AdministrationCompanyDetail,
  "representativeAccount" | "userAccounts" | "userCount" | "productCount"
>
type CountRow = { count: number }
type CategoryIdRow = { id: string }
type CompanyAccountRow = AdministrationCompanyAccount

function normalizeNullableText(value: string | null | undefined) {
  const normalized = value?.trim() ?? ""
  return normalized || null
}

function normalizeCategoryIds(categoryIds: string[]) {
  return Array.from(
    new Set(categoryIds.map((categoryId) => categoryId.trim()).filter(Boolean))
  )
}

function assertTextLength(
  value: string | null,
  label: string,
  maxLength: number
) {
  if (value && value.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`)
  }
}

export async function getAdministrationCompanyDetail(
  companyIdInput: string
): Promise<AdministrationCompanyDetail | null> {
  await ensurePlatformSchema()

  const companyId = companyIdInput.trim()
  if (!companyId) return null

  const companyRows = (await sql`
    select
      company.id,
      company.name,
      company.tax_id as "taxId",
      company.logo_url as "logoUrl",
      company.website,
      company.address,
      company.is_active as "isActive",
      company.created_at as "createdAt",
      company.updated_at as "updatedAt",
      company.representative_user_id as "representativeUserId",
      coalesce(
        array_agg(distinct category.id order by category.id)
          filter (where category.id is not null),
        '{}'::text[]
      ) as "categoryIds",
      coalesce(
        array_agg(distinct category.name order by category.name)
          filter (where category.id is not null),
        '{}'::text[]
      ) as "categoryNames"
    from companies company
    left join company_categories company_category
      on company_category.company_id = company.id
    left join exhibitor_categories category
      on category.id = company_category.category_id
      and category.level = 3
    where company.id = ${companyId}
    group by company.id
    limit 1
  `) as CompanyRow[]

  const company = companyRows[0]
  if (!company) return null

  const [userCountRows, productCountRows, userAccountRows] = await Promise.all([
    sql`
      select count(*)::int as count
      from users
      where company_id = ${companyId}
    `,
    sql`
      select count(*)::int as count
      from company_products
      where company_id = ${companyId}
    `,
    sql`
      select
        app_user.id,
        app_user.name,
        app_user.email,
        app_user.avatar_url as "avatarUrl",
        app_user.is_active as "isActive",
        coalesce(
          array_agg(distinct user_roles.role_id order by user_roles.role_id)
            filter (where user_roles.role_id is not null),
          '{}'::text[]
        ) as "roleIds"
      from users app_user
      left join user_roles
        on user_roles.user_id = app_user.id
        and user_roles.expo_id is null
      where app_user.company_id = ${companyId}
      group by app_user.id
      order by app_user.name asc
    `
  ])
  const userAccounts = userAccountRows as CompanyAccountRow[]

  return {
    ...company,
    userCount: Number((userCountRows as CountRow[])[0]?.count ?? 0),
    productCount: Number((productCountRows as CountRow[])[0]?.count ?? 0),
    representativeAccount:
      userAccounts.find(
        (account) => account.id === company.representativeUserId
      ) ?? null,
    userAccounts
  }
}

export async function updateAdministrationCompany(
  input: UpdateAdministrationCompanyInput
): Promise<{ id: string }> {
  await ensurePlatformSchema()

  const companyId = input.companyId.trim()
  const name = input.name.trim()
  const taxId = normalizeNullableText(input.taxId)
  const logoUrl = normalizeNullableText(input.logoUrl)
  const website = normalizeNullableText(input.website)
  const address = normalizeNullableText(input.address)
  const categoryIds = normalizeCategoryIds(input.categoryIds)
  const representativeUserId = normalizeNullableText(input.representativeUserId)

  if (!companyId) {
    throw new Error("Company ID is required.")
  }
  if (!name || name.length > 255) {
    throw new Error("Company name is required (max 255 characters).")
  }
  assertTextLength(taxId, "Tax ID", 255)
  assertTextLength(logoUrl, "Logo URL", 1024)
  assertTextLength(website, "Website", 1024)
  assertTextLength(address, "Address", 1024)

  const existingRows = (await sql`
    select id from companies where id = ${companyId} limit 1
  `) as CategoryIdRow[]
  if (existingRows.length === 0) {
    throw new Error("Company not found.")
  }

  if (categoryIds.length > 0) {
    const validCategoryRows = (await sql`
      select id
      from exhibitor_categories
      where id = any(${categoryIds}::text[])
        and level = 3
        and is_active = true
    `) as CategoryIdRow[]
    if (validCategoryRows.length !== categoryIds.length) {
      throw new Error("One or more company categories are invalid.")
    }
  }

  if (representativeUserId) {
    const representativeRows = (await sql`
      select id
      from users
      where id = ${representativeUserId}
        and company_id = ${companyId}
      limit 1
    `) as CategoryIdRow[]
    if (representativeRows.length === 0) {
      throw new Error(
        "Company representative must be an account in this company."
      )
    }
  }

  await sql.transaction([
    sql`
      update companies
      set
        name = ${name},
        tax_id = ${taxId},
        logo_url = ${logoUrl},
        website = ${website},
        address = ${address},
        is_active = ${input.isActive},
        representative_user_id = ${representativeUserId},
        updated_at = now()
      where id = ${companyId}
    `,
    sql`
      delete from company_categories
      where company_id = ${companyId}
    `,
    sql`
      insert into company_categories (company_id, category_id)
      select ${companyId}, id
      from exhibitor_categories
      where id = any(${categoryIds}::text[])
        and level = 3
        and is_active = true
      on conflict do nothing
    `
  ])

  return { id: companyId }
}

export type CompanyDetailCategoryOption = CompanyCategoryOption
