import { sql } from "@/lib/db/neon"
import type { CompanyProduct } from "@/lib/tradexpo/types"

function toIso(value: string | Date) {
  return new Date(value).toISOString()
}

const DEFAULT_LIST_LIMIT = 200

function normalizeLimit(limit: number | undefined) {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return DEFAULT_LIST_LIMIT
  }
  return Math.max(1, Math.min(1000, Math.floor(limit)))
}

type ProductRow = {
  id: string
  company_id: string
  name: string
  description: string | null
  price: string | number | null
  currency: string
  sku: string | null
  main_image_url: string | null
  gallery_urls: string[]
  category_id: string | null
  is_active: boolean
  metadata: Record<string, unknown>
  created_at: string | Date
  updated_at: string | Date
}

function rowToProduct(r: ProductRow): CompanyProduct {
  return {
    id: r.id,
    companyId: r.company_id,
    name: r.name,
    description: r.description ?? undefined,
    price: r.price ? Number(r.price) : undefined,
    currency: r.currency,
    sku: r.sku ?? undefined,
    mainImageUrl: r.main_image_url ?? undefined,
    galleryUrls: r.gallery_urls ?? [],
    categoryId: r.category_id ?? undefined,
    isActive: r.is_active,
    metadata: r.metadata ?? {},
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at)
  }
}

export async function listCompanyProducts(
  companyId: string,
  options?: { limit?: number }
): Promise<CompanyProduct[]> {
  const limit = normalizeLimit(options?.limit)
  const rows = (await sql`
    select * from company_products
    where company_id = ${companyId}
    order by created_at desc
    limit ${limit}
  `) as ProductRow[]
  return rows.map(rowToProduct)
}

export async function getProductById(
  productId: string
): Promise<CompanyProduct | null> {
  const rows = (await sql`
    select * from company_products
    where id = ${productId}
    limit 1
  `) as ProductRow[]
  const r = rows[0]
  return r ? rowToProduct(r) : null
}

export async function upsertCompanyProduct(
  product: Partial<CompanyProduct> & { companyId: string; name: string }
): Promise<string> {
  const id = product.id ?? `prod-${crypto.randomUUID()}`
  const now = new Date().toISOString()

  await sql`
    insert into company_products (
      id, company_id, name, description, price, currency, sku,
      main_image_url, gallery_urls, category_id, is_active, metadata,
      created_at, updated_at
    )
    values (
      ${id},
      ${product.companyId},
      ${product.name},
      ${product.description ?? null},
      ${product.price ?? null},
      ${product.currency ?? "VND"},
      ${product.sku ?? null},
      ${product.mainImageUrl ?? null},
      ${JSON.stringify(product.galleryUrls ?? [])}::jsonb,
      ${product.categoryId ?? null},
      ${product.isActive ?? true},
      ${JSON.stringify(product.metadata ?? {})}::jsonb,
      ${product.createdAt ?? now},
      ${now}
    )
    on conflict (id) do update set
      name = excluded.name,
      description = excluded.description,
      price = excluded.price,
      currency = excluded.currency,
      sku = excluded.sku,
      main_image_url = excluded.main_image_url,
      gallery_urls = excluded.gallery_urls,
      category_id = excluded.category_id,
      is_active = excluded.is_active,
      metadata = excluded.metadata,
      updated_at = now()
  `
  return id
}

export async function deleteCompanyProduct(productId: string): Promise<void> {
  await sql`delete from company_products where id = ${productId}`
}
