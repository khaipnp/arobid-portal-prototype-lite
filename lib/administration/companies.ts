import type {
  AdminCompany,
  CompanyCategoryOption,
  ListResponse
} from "@/lib/administration/types"
import { sql } from "@/lib/db/neon"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export type CompanyStatusFilter = "all" | "approved" | "pending"

export type CompanyListInput = {
  page?: number | string | null
  pageSize?: number | string | null
  search?: string | null
  categoryId?: string | null
  status?: string | null
}

export type CompanyListResponse = ListResponse<AdminCompany> & {
  categories: CompanyCategoryOption[]
}

type CountRow = { count: number }
type CompanyRow = {
  id: string
  name: string
  taxId: string | null
  logoUrl: string | null
  website: string | null
  address: string | null
  categoryNames: string[] | null
  isActive: boolean
}

function parsePositiveInt(
  value: string | number | null | undefined,
  fallback: number
) {
  if (typeof value === "number")
    return Number.isFinite(value) && value > 0 ? value : fallback
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseCompanyStatusFilter(
  value: string | null | undefined
): CompanyStatusFilter {
  return value === "approved" || value === "pending" ? value : "all"
}

function mapCompanyRow(row: CompanyRow): AdminCompany {
  return {
    id: row.id,
    name: row.name,
    taxId: row.taxId,
    logoUrl: row.logoUrl,
    website: row.website,
    address: row.address,
    categoryNames: row.categoryNames ?? [],
    isActive: row.isActive
  }
}

export async function listCompanyCategoryOptions(): Promise<
  CompanyCategoryOption[]
> {
  await ensurePlatformSchema()

  return (await sql`
    select id, name
    from exhibitor_categories
    where level = 3
      and is_active = true
    order by name asc
  `) as CompanyCategoryOption[]
}

export async function listAdminCompanies(
  input: CompanyListInput = {}
): Promise<CompanyListResponse> {
  await ensurePlatformSchema()

  const page = parsePositiveInt(input.page, 1)
  const pageSize = parsePositiveInt(input.pageSize, 20)
  const search = (input.search ?? "").trim().toLowerCase()
  const categoryId = input.categoryId ?? "all"
  const status = parseCompanyStatusFilter(input.status)
  const searchPattern = `%${search}%`

  const [countRows, categories] = await Promise.all([
    sql`
      select count(*)::int as count
      from companies company
      where (
        lower(company.name) like ${searchPattern}
        or lower(coalesce(company.tax_id, '')) like ${searchPattern}
        or lower(coalesce(company.website, '')) like ${searchPattern}
        or lower(coalesce(company.address, '')) like ${searchPattern}
      )
        and (${categoryId} = 'all' or exists (
          select 1
          from company_categories company_category
          where company_category.company_id = company.id
            and company_category.category_id = ${categoryId}
        ))
        and (${status} = 'all'
          or (${status} = 'approved' and company.is_active)
          or (${status} = 'pending' and not company.is_active))
    `,
    listCompanyCategoryOptions()
  ])

  const totalItems = Number((countRows as CountRow[])[0]?.count ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize

  const rows = (await sql`
    select
      company.id,
      company.name,
      company.tax_id as "taxId",
      company.logo_url as "logoUrl",
      company.website,
      company.address,
      company.is_active as "isActive",
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
    where (
      lower(company.name) like ${searchPattern}
      or lower(coalesce(company.tax_id, '')) like ${searchPattern}
      or lower(coalesce(company.website, '')) like ${searchPattern}
      or lower(coalesce(company.address, '')) like ${searchPattern}
    )
      and (${categoryId} = 'all' or exists (
        select 1
        from company_categories selected_category
        where selected_category.company_id = company.id
          and selected_category.category_id = ${categoryId}
      ))
      and (${status} = 'all'
        or (${status} = 'approved' and company.is_active)
        or (${status} = 'pending' and not company.is_active))
    group by company.id
    order by company.name asc
    limit ${pageSize} offset ${start}
  `) as CompanyRow[]

  return {
    data: rows.map(mapCompanyRow),
    categories,
    meta: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages
    }
  }
}
