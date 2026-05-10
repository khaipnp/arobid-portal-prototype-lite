import { describe, expect, test } from "bun:test"
import { resolve } from "node:path"
import { config } from "dotenv"

config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

describe("platform schema consistency", () => {
  test("allows non-TradeXpo orders without booth fields", async () => {
    const { sql } = await import("@/lib/db/neon")
    const { ensurePlatformSchema } = await import(
      "@/lib/platform/ensure-schema"
    )

    await ensurePlatformSchema()

    const columns = (await sql`
      select column_name, is_nullable
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'orders'
        and column_name in ('expo_name', 'booth_ref', 'booth_tier')
      order by column_name
    `) as { column_name: string; is_nullable: "YES" | "NO" }[]

    expect(columns).toEqual([
      { column_name: "booth_ref", is_nullable: "YES" },
      { column_name: "booth_tier", is_nullable: "YES" },
      { column_name: "expo_name", is_nullable: "YES" }
    ])

    await sql`delete from orders where id = 'test-order-b2b-package'`
    try {
      await sql`
        insert into orders (
          id,
          customer_id,
          customer_name,
          customer_email,
          customer_company,
          order_type,
          reference_id,
          expo_name,
          booth_ref,
          booth_tier,
          amount,
          payment_method,
          status,
          created_at,
          updated_at
        )
        values (
          'test-order-b2b-package',
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
          'Test User',
          'test@example.com',
          'Arobid',
          'b2b_subscription',
          'package-basic',
          null,
          null,
          null,
          100000,
          'vnpay',
          'Paid',
          now(),
          now()
        )
      `

      const rows = (await sql`
        select order_type, expo_name, booth_ref, booth_tier
        from orders
        where id = 'test-order-b2b-package'
      `) as {
        order_type: string
        expo_name: string | null
        booth_ref: string | null
        booth_tier: string | null
      }[]

      expect(rows[0]).toEqual({
        order_type: "b2b_subscription",
        expo_name: null,
        booth_ref: null,
        booth_tier: null
      })
    } finally {
      await sql`delete from orders where id = 'test-order-b2b-package'`
    }
  })

  test("scopes seller booth registrations by user", async () => {
    const { sql } = await import("@/lib/db/neon")
    const { ensurePlatformSchema } = await import(
      "@/lib/platform/ensure-schema"
    )
    const { listSellerBoothRegistrations } = await import(
      "@/lib/tradexpo/db/platform-data"
    )

    await ensurePlatformSchema()

    await sql`delete from booth_customizations where registration_id like 'test-reg-%'`
    await sql`delete from seller_booth_registrations where id like 'test-reg-%'`
    await sql`delete from users where id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2')`
    await sql`delete from expos where id = 'test-expo-scope'`

    try {
      await sql`
        insert into users (id, name, email, company, is_active)
        values
          ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Test User A', 'test-user-a@example.com', 'Arobid', true),
          ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'Test User B', 'test-user-b@example.com', 'Arobid', true)
        on conflict (id) do nothing
      `

      await sql`
        insert into expos (
          id,
          name,
          thumbnail_url,
          owner_email,
          start_date,
          end_date,
          status,
          category_ids,
          created_at
        )
        values (
          'test-expo-scope',
          'Scope Test Expo',
          'https://example.com/thumb.png',
          'owner@example.com',
          current_date,
          current_date + interval '1 day',
          'Live',
          '[]'::jsonb,
          now()
        )
      `

      await sql`
        insert into seller_booth_registrations (
          id,
          user_id,
          expo_id,
          booth_ref,
          booth_tier,
          status,
          purchased_at
        )
        values
          ('test-reg-user-a', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'test-expo-scope', 'A01', 'Basic', 'Live', now()),
          ('test-reg-user-b', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'test-expo-scope', 'A02', 'Basic', 'Live', now())
      `

      const registrations = await listSellerBoothRegistrations(
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"
      )

      expect(registrations.map((registration) => registration.id)).toEqual([
        "test-reg-user-a"
      ])
    } finally {
      await sql`delete from booth_customizations where registration_id like 'test-reg-%'`
      await sql`delete from seller_booth_registrations where id like 'test-reg-%'`
      await sql`delete from users where id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2')`
      await sql`delete from expos where id = 'test-expo-scope'`
    }
  })
})
