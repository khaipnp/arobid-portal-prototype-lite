import { sql } from "@/lib/db/neon"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

type CategoryNode = {
  id: string
  name: string
  children?: CategoryNode[]
}

const CATEGORY_TREE: CategoryNode[] = [
  {
    id: "cat-l1-food-beverage",
    name: "Food & Beverage",
    children: [
      {
        id: "cat-l2-fb-processed-food",
        name: "Processed Food",
        children: [
          { id: "cat-l3-fb-snacks", name: "Snacks & Confectionery" },
          { id: "cat-l3-fb-frozen-food", name: "Frozen Food" },
          { id: "cat-l3-fb-canned-food", name: "Canned & Preserved Food" }
        ]
      },
      {
        id: "cat-l2-fb-beverages",
        name: "Beverages",
        children: [
          { id: "cat-l3-fb-non-alcoholic", name: "Non-Alcoholic Drinks" },
          { id: "cat-l3-fb-coffee-tea", name: "Coffee & Tea" },
          { id: "cat-l3-fb-functional", name: "Functional Beverages" }
        ]
      }
    ]
  },
  {
    id: "cat-l1-fashion-lifestyle",
    name: "Fashion & Lifestyle",
    children: [
      {
        id: "cat-l2-fl-apparel",
        name: "Apparel",
        children: [
          { id: "cat-l3-fl-men", name: "Men's Wear" },
          { id: "cat-l3-fl-women", name: "Women's Wear" },
          { id: "cat-l3-fl-kids", name: "Kids' Wear" }
        ]
      },
      {
        id: "cat-l2-fl-accessories",
        name: "Accessories",
        children: [
          { id: "cat-l3-fl-bags", name: "Bags & Leather Goods" },
          { id: "cat-l3-fl-jewelry", name: "Jewelry & Watches" },
          { id: "cat-l3-fl-footwear", name: "Footwear" }
        ]
      }
    ]
  },
  {
    id: "cat-l1-home-living",
    name: "Home & Living",
    children: [
      {
        id: "cat-l2-hl-furniture",
        name: "Furniture",
        children: [
          { id: "cat-l3-hl-office", name: "Office Furniture" },
          { id: "cat-l3-hl-residential", name: "Residential Furniture" },
          { id: "cat-l3-hl-outdoor", name: "Outdoor Furniture" }
        ]
      },
      {
        id: "cat-l2-hl-decor",
        name: "Home Decor",
        children: [
          { id: "cat-l3-hl-lighting", name: "Lighting" },
          { id: "cat-l3-hl-kitchenware", name: "Kitchenware" },
          { id: "cat-l3-hl-textiles", name: "Home Textiles" }
        ]
      }
    ]
  }
]

type FlatCategory = {
  id: string
  name: string
  level: number
  parentId: string | null
  sortOrder: number
}

function flattenTree(
  nodes: CategoryNode[],
  level: number,
  parentId: string | null
): FlatCategory[] {
  const out: FlatCategory[] = []
  for (const [index, node] of nodes.entries()) {
    out.push({
      id: node.id,
      name: node.name,
      level,
      parentId,
      sortOrder: index + 1
    })
    if (node.children && node.children.length > 0) {
      out.push(...flattenTree(node.children, level + 1, node.id))
    }
  }
  return out
}

async function upsertCategories(rows: FlatCategory[]) {
  for (const row of rows) {
    await sql`
      insert into exhibitor_categories (
        id, name, level, parent_id, sort_order, is_active
      ) values (
        ${row.id}, ${row.name}, ${row.level}, ${row.parentId}, ${row.sortOrder}, true
      )
      on conflict (id) do update
      set
        name = excluded.name,
        level = excluded.level,
        parent_id = excluded.parent_id,
        sort_order = excluded.sort_order,
        is_active = excluded.is_active
    `
  }
}

async function seedIndustryForExhibitors(leafCategoryIds: string[]) {
  const exhibitors = (await sql`
    select distinct cu.id
    from chat_users cu
    join seller_booth_registrations sbr on sbr.user_id = cu.id
    order by cu.id asc
  `) as { id: string }[]

  let seeded = 0
  for (const [index, user] of exhibitors.entries()) {
    const leafId = leafCategoryIds[index % leafCategoryIds.length]
    await sql`
      update chat_users cu
      set
        industry_category_id = ${leafId},
        industry = ec.name
      from exhibitor_categories ec
      where
        cu.id = ${user.id}
        and ec.id = ${leafId}
        and (cu.industry_category_id is null or length(trim(cu.industry_category_id)) = 0)
    `
    seeded += 1
  }
  return seeded
}

async function main() {
  await ensurePlatformSchema()

  const flat = flattenTree(CATEGORY_TREE, 1, null)
  const leafCategoryIds = flat.filter((x) => x.level === 3).map((x) => x.id)

  await upsertCategories(flat)
  const seededCount = await seedIndustryForExhibitors(leafCategoryIds)

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        categoriesUpserted: flat.length,
        leafCategories: leafCategoryIds.length,
        exhibitorsProcessed: seededCount
      },
      null,
      2
    )
  )
}

if (import.meta.main) {
  await main()
}
