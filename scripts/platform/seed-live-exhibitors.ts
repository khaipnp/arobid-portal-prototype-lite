import { randomUUID } from "node:crypto"

import { sql } from "@/lib/db/neon"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

type LiveExpoRow = {
  id: string
  name: string
  slug: string | null
}

const TIERS = ["Basic", "Professional", "Premium"] as const
const BOOTH_STATUS = [
  "Pending Setup",
  "Configured",
  "Approved",
  "Live",
] as const

function pick<T>(arr: readonly T[], index: number) {
  return arr[index % arr.length]
}

async function getTargetLiveExpo(): Promise<LiveExpoRow> {
  const rows = (await sql`
    select id, name, slug
    from expos
    where status = 'Live'
    order by created_at desc
    limit 1
  `) as LiveExpoRow[]

  const expo = rows[0]
  if (!expo) {
    throw new Error("No expo with status 'Live' found.")
  }
  return expo
}

async function seedExhibitorsForLiveExpo(count: number) {
  await ensurePlatformSchema()
  const expo = await getTargetLiveExpo()

  const now = new Date()
  const batchPrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`

  for (let i = 0; i < count; i += 1) {
    const serial = String(i + 1).padStart(3, "0")
    const userId = `seed-live-user-${batchPrefix}-${serial}-${randomUUID().slice(0, 8)}`
    const registrationId = `seed-live-reg-${batchPrefix}-${serial}-${randomUUID().slice(0, 8)}`
    const company = `Live Expo Company ${serial}`
    const tier = pick(TIERS, i)
    const purchasedAt = new Date(now.getTime() - i * 86_400_000).toISOString()
    const boothRef = `L-${String(i + 1).padStart(4, "0")}`

    await sql`
      insert into chat_users (
        id, name, email, company, job_title, phone, website, location, avatar_url, is_active
      ) values (
        ${userId},
        ${`Exhibitor ${serial}`},
        ${`seed.live.${batchPrefix}.${serial}@example.com`},
        ${company},
        ${"Sales Manager"},
        ${"+84-000-000-000"},
        ${`https://company-${serial}.example.com`},
        ${"Vietnam"},
        ${null},
        ${true}
      )
    `

    await sql`
      insert into seller_booth_registrations (
        id, user_id, expo_id, slot_id, booth_template_id, booth_ref, booth_tier, status, purchased_at
      ) values (
        ${registrationId},
        ${userId},
        ${expo.id},
        ${null},
        ${null},
        ${boothRef},
        ${tier},
        ${pick(BOOTH_STATUS, i)},
        ${purchasedAt}
      )
    `

    const products = [
      {
        id: `seed-product-${serial}-1`,
        name: `Featured Product ${serial}A`,
        description: `Primary catalog product ${serial}A`,
      },
      {
        id: `seed-product-${serial}-2`,
        name: `Featured Product ${serial}B`,
        description: `Primary catalog product ${serial}B`,
      },
    ]

    await sql`
      insert into booth_customizations (
        registration_id,
        selected_booth_template_id,
        publish_status,
        colors,
        logo_url,
        image_urls,
        video_type,
        video_url,
        products
      ) values (
        ${registrationId},
        ${null},
        ${"Published"},
        ${JSON.stringify(["#ED6203", "#1F2937"])}::jsonb,
        ${""},
        ${JSON.stringify([])}::jsonb,
        ${"youtube"},
        ${`https://www.youtube.com/watch?v=seed${serial}`},
        ${JSON.stringify(products)}::jsonb
      )
    `
  }

  // eslint-disable-next-line no-console
  console.log(
    `Seeded ${count} exhibitors for expo "${expo.name}" (id=${expo.id}, slug=${expo.slug ?? "null"}).`,
  )
}

if (import.meta.main) {
  const arg = Number(process.argv[2] ?? "120")
  const count = Number.isFinite(arg) ? Math.max(100, Math.min(150, arg)) : 120
  await seedExhibitorsForLiveExpo(count)
}
