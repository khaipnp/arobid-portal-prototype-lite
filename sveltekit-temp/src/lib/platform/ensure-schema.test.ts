import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { config } from "dotenv"

config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

describe("platform schema consistency", () => {
  test("includes partner governance and mini-site schema DDL", () => {
    const sqlText = readFileSync(
      resolve(process.cwd(), "lib/platform/ensure-schema.ts"),
      "utf8"
    ).toLowerCase()

    expect(sqlText).toContain(
      "create table if not exists partner_capability_assignments"
    )
    expect(sqlText).toContain(
      "create table if not exists partner_scope_assignments"
    )
    expect(sqlText).toContain("create table if not exists partner_mini_sites")
    expect(sqlText).toContain(
      "create table if not exists partner_mini_site_review_events"
    )
    expect(sqlText).toContain(
      "check (capability in ('overview', 'mini_site', 'enterprise_association', 'expo_programs', 'tradecredit_reporting', 'analytics_reporting'))"
    )
    expect(sqlText).toContain(
      "check (scope_type in ('expo', 'program', 'company'))"
    )
    expect(sqlText).toContain("check (status in ('active', 'inactive'))")
    expect(sqlText).toContain("idx_partner_scope_assignments_active_unique")
    expect(sqlText).toContain("idx_partner_mini_sites_one_published")
    expect(sqlText).toContain(
      "check (status in ('draft', 'submitted', 'rejected', 'published', 'superseded', 'draft_update'))"
    )
    expect(sqlText).toContain("insert into partner_capability_assignments")
    expect(sqlText).toContain("('tradecredit_reporting')")
    expect(sqlText).toContain("insert into partner_scope_assignments")
    expect(sqlText).toContain("from partner_expo_assignments pea")
    expect(sqlText).toContain("inner join expos e on e.id = pea.expo_id")
  })

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
        insert into users (id, name, email, is_active)
        values
          ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Test User A', 'test-user-a@example.com', true),
          ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'Test User B', 'test-user-b@example.com', true)
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

  test("lists partner portal expos through organization assignments", async () => {
    const { sql } = await import("@/lib/db/neon")
    const { ensureCoHostPartnerAssignment, listPartnerAssignedExpos } =
      await import("@/lib/partner/db")
    const { ensurePlatformSchema } = await import(
      "@/lib/platform/ensure-schema"
    )

    await ensurePlatformSchema()

    await sql`delete from partner_expo_assignments where expo_id = 'test-expo-partner-assignment'`
    await sql`delete from partner_memberships where user_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'`
    await sql`delete from partner_organizations where primary_user_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'`
    await sql`delete from expos where id = 'test-expo-partner-assignment'`
    await sql`delete from users where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'`

    try {
      await sql`
        insert into users (id, name, email, is_active)
        values (
          'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
          'Partner Test User',
          'partner-test@example.com',
          true
        )
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
          created_at,
          owner_user_id
        )
        values (
          'test-expo-partner-assignment',
          'Partner Assignment Test Expo',
          'https://example.com/thumb.png',
          'partner-test@example.com',
          current_date,
          current_date + interval '1 day',
          'Live',
          '[]'::jsonb,
          now(),
          'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'
        )
      `

      await ensureCoHostPartnerAssignment({
        userId: "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
        userEmail: "partner-test@example.com",
        expoId: "test-expo-partner-assignment"
      })

      const assignedExpos = await listPartnerAssignedExpos(
        "cccccccc-cccc-4ccc-8ccc-ccccccccccc3"
      )

      expect(assignedExpos.map((item) => item.expo.id)).toContain(
        "test-expo-partner-assignment"
      )
      expect(
        assignedExpos.find(
          (item) => item.expo.id === "test-expo-partner-assignment"
        )?.assignment.partnerOrganization.model
      ).toBe("co_host")
    } finally {
      await sql`delete from partner_expo_assignments where expo_id = 'test-expo-partner-assignment'`
      await sql`delete from partner_memberships where user_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'`
      await sql`delete from partner_organizations where primary_user_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'`
      await sql`delete from expos where id = 'test-expo-partner-assignment'`
      await sql`delete from users where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'`
    }
  })

  test("persists user wishlist items for sellers and expos", async () => {
    const { sql } = await import("@/lib/db/neon")
    const { ensurePlatformSchema } = await import(
      "@/lib/platform/ensure-schema"
    )
    const {
      addWishlistExhibitor,
      addWishlistItem,
      listWishlistedTargetIds,
      listWishlistedRegistrationIds,
      listWishlistItems,
      removeWishlistExhibitor
    } = await import("@/lib/wishlist/db")

    await ensurePlatformSchema()

    await sql`delete from user_wishlist_items where target_id in ('test-reg-wishlist', 'test-expo-wishlist')`
    await sql`delete from user_wishlist_exhibitors where registration_id = 'test-reg-wishlist'`
    await sql`delete from seller_booth_registrations where id = 'test-reg-wishlist'`
    await sql`delete from expos where id = 'test-expo-wishlist'`
    await sql`delete from users where id in ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')`

    try {
      await sql`
        insert into users (id, name, email, is_active)
        values
          ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Wishlist Buyer', 'wishlist-buyer@example.com', true),
          ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Wishlist Seller', 'wishlist-seller@example.com', true)
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
          'test-expo-wishlist',
          'Wishlist Test Expo',
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
        values (
          'test-reg-wishlist',
          'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          'test-expo-wishlist',
          'W01',
          'Premium',
          'Live',
          now()
        )
      `

      await addWishlistExhibitor({
        userId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        registrationId: "test-reg-wishlist"
      })
      await addWishlistItem({
        userId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        targetType: "expo",
        targetId: "test-expo-wishlist"
      })

      const ids = await listWishlistedRegistrationIds(
        "dddddddd-dddd-4ddd-8ddd-dddddddddddd"
      )
      const expoIds = await listWishlistedTargetIds(
        "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        "expo"
      )
      const items = await listWishlistItems(
        "dddddddd-dddd-4ddd-8ddd-dddddddddddd"
      )
      const sellerItem = items.find((item) => item.targetType === "seller")
      const expoItem = items.find((item) => item.targetType === "expo")

      expect([...ids]).toEqual(["test-reg-wishlist"])
      expect([...expoIds]).toEqual(["test-expo-wishlist"])
      expect(sellerItem?.registrationId).toBe("test-reg-wishlist")
      expect(sellerItem?.company).toBe("Wishlist Seller")
      expect(sellerItem?.boothTier).toBe("Premium")
      expect(sellerItem?.boothRef).toBe("W01")
      expect(sellerItem?.expo.id).toBe("test-expo-wishlist")
      expect(sellerItem?.expo.name).toBe("Wishlist Test Expo")
      expect(sellerItem?.expo.status).toBe("Live")
      expect(expoItem?.expo.id).toBe("test-expo-wishlist")
      expect(expoItem?.expo.name).toBe("Wishlist Test Expo")

      await removeWishlistExhibitor({
        userId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        registrationId: "test-reg-wishlist"
      })

      const afterRemove = await listWishlistedRegistrationIds(
        "dddddddd-dddd-4ddd-8ddd-dddddddddddd"
      )
      expect([...afterRemove]).toEqual([])
    } finally {
      await sql`delete from user_wishlist_items where target_id in ('test-reg-wishlist', 'test-expo-wishlist')`
      await sql`delete from user_wishlist_exhibitors where registration_id = 'test-reg-wishlist'`
      await sql`delete from seller_booth_registrations where id = 'test-reg-wishlist'`
      await sql`delete from expos where id = 'test-expo-wishlist'`
      await sql`delete from users where id in ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')`
    }
  })
})
