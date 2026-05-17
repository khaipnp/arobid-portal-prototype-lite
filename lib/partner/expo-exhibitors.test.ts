import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { sql } from "@/lib/db/neon"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  getPartnerExpoExhibitorDetail,
  getPartnerExpoExhibitors
} from "@/lib/partner/db"

const ids = {
  partnerUser: "test-partner-exhibitors-owner",
  outsiderUser: "test-partner-exhibitors-outsider",
  org: "test-partner-exhibitors-org",
  outsiderOrg: "test-partner-exhibitors-outsider-org",
  expo: "test-partner-exhibitors-expo",
  company: "test-partner-exhibitors-company",
  sellerA: "test-partner-exhibitors-seller-a",
  sellerB: "test-partner-exhibitors-seller-b",
  fallbackSeller: "test-partner-exhibitors-seller-fallback",
  regA: "test-partner-exhibitors-reg-a",
  regB: "test-partner-exhibitors-reg-b",
  regFallback: "test-partner-exhibitors-reg-fallback",
  orderA: "test-partner-exhibitors-order-a",
  orderB: "test-partner-exhibitors-order-b",
  orderFallback: "test-partner-exhibitors-order-fallback"
}

async function cleanup() {
  await sql`delete from orders where id like 'test-partner-exhibitors-%'`
  await sql`delete from booth_customizations where registration_id like 'test-partner-exhibitors-%'`
  await sql`delete from seller_booth_registrations where id like 'test-partner-exhibitors-%'`
  await sql`delete from partner_expo_assignments where expo_id like 'test-partner-exhibitors-%'`
  await sql`delete from expos where id like 'test-partner-exhibitors-%'`
  await sql`delete from partner_memberships where user_id like 'test-partner-exhibitors-%'`
  await sql`delete from partner_organizations where id like 'test-partner-exhibitors-%'`
  await sql`delete from users where id like 'test-partner-exhibitors-%'`
  await sql`delete from companies where id like 'test-partner-exhibitors-%'`
}

beforeEach(async () => {
  await ensurePlatformSchema()
  await cleanup()

  await sql`
    insert into users (id, name, email, is_active)
    values
      (${ids.partnerUser}, 'Partner Owner', 'partner-owner@test.local', true),
      (${ids.outsiderUser}, 'Outsider Partner', 'outsider-partner@test.local', true)
  `

  await sql`
    insert into partner_organizations (id, name, model, partner_type, status, primary_user_id)
    values
      (${ids.org}, 'Expo Owner Org', 'turnkey', 'expo_partner', 'active', ${ids.partnerUser}),
      (${ids.outsiderOrg}, 'Outsider Org', 'turnkey', 'expo_partner', 'active', ${ids.outsiderUser})
  `

  await sql`
    insert into partner_memberships (id, partner_org_id, user_id, role, status)
    values
      ('test-partner-exhibitors-membership-a', ${ids.org}, ${ids.partnerUser}, 'partner_owner', 'active'),
      ('test-partner-exhibitors-membership-b', ${ids.outsiderOrg}, ${ids.outsiderUser}, 'partner_owner', 'active')
  `

  await sql`
    insert into expos (id, name, thumbnail_url, owner_email, start_date, end_date, status, category_ids, created_at)
    values (${ids.expo}, 'Partner Exhibitors Expo', '', 'owner@test.local', '2026-06-01', '2026-06-03', 'Live', '{}', now())
  `

  await sql`
    insert into partner_expo_assignments (id, partner_org_id, expo_id, partnership_model)
    values ('test-partner-exhibitors-assignment', ${ids.org}, ${ids.expo}, 'turnkey')
  `

  await sql`
    insert into companies (id, name, tax_id, logo_url, website, address, is_active)
    values (${ids.company}, 'Acme Exhibitor Co', 'TAX-123', '/logo.png', 'https://acme.example', 'Ho Chi Minh City', true)
  `

  await sql`
    insert into users (id, name, email, company_id, phone, website, location, is_active)
    values
      (${ids.sellerA}, 'Seller A', 'seller-a@test.local', ${ids.company}, '0901', 'https://seller-a.example', 'HCMC', true),
      (${ids.sellerB}, 'Seller B', 'seller-b@test.local', ${ids.company}, '0902', 'https://seller-b.example', 'HCMC', true),
      (${ids.fallbackSeller}, 'Fallback Seller', 'fallback@test.local', null, '0903', null, 'Da Nang', true)
  `

  await sql`
    insert into seller_booth_registrations (id, user_id, expo_id, slot_id, booth_template_id, booth_ref, booth_tier, status, purchased_at)
    values
      (${ids.regA}, ${ids.sellerA}, ${ids.expo}, 'A1', null, 'A-01', 'Basic', 'Confirmed', '2026-05-01T00:00:00Z'),
      (${ids.regB}, ${ids.sellerB}, ${ids.expo}, 'B1', null, 'B-01', 'Premium', 'Confirmed', '2026-05-02T00:00:00Z'),
      (${ids.regFallback}, ${ids.fallbackSeller}, ${ids.expo}, 'C1', null, 'C-01', 'Professional', 'Pending', '2026-05-03T00:00:00Z')
  `

  await sql`
    insert into booth_customizations (registration_id, selected_booth_template_id, publish_status, colors, logo_url, image_urls, video_url, products)
    values
      (${ids.regA}, null, 'Published', '{}', '', '[]', '', '[{"id":"p1"},{"id":"p2"}]'),
      (${ids.regB}, null, 'Draft', '{}', '', '[]', '', '[{"id":"p3"}]')
  `

  await sql`
    insert into orders (id, customer_id, customer_name, customer_email, customer_company, order_type, reference_id, expo_name, booth_ref, booth_tier, original_amount, discount_amount, amount, payment_method, status, created_at, updated_at)
    values
      (${ids.orderA}, ${ids.sellerA}, 'Seller A', 'seller-a@test.local', 'Acme Exhibitor Co', 'booth_registration', ${ids.regA}, 'Partner Exhibitors Expo', 'A-01', 'Basic', 1000000, 0, 1000000, 'bank_transfer', 'Paid', now(), now()),
      (${ids.orderB}, ${ids.sellerB}, 'Seller B', 'seller-b@test.local', 'Acme Exhibitor Co', 'booth_registration', 'legacy-ref', 'Partner Exhibitors Expo', 'B-01', 'Premium', 2000000, 500000, 1500000, 'vnpay', 'Pending', now(), now()),
      (${ids.orderFallback}, ${ids.fallbackSeller}, 'Fallback Seller', 'fallback@test.local', 'Fallback Seller', 'booth_registration', ${ids.regFallback}, 'Partner Exhibitors Expo', 'C-01', 'Professional', 3000000, 0, 3000000, 'bank_transfer', 'Pending', now(), now())
  `
})

afterEach(cleanup)

describe("getPartnerExpoExhibitors", () => {
  test("groups multiple booth registrations from the same company", async () => {
    const workspace = await getPartnerExpoExhibitors(ids.partnerUser, ids.expo)

    expect(workspace).not.toBeNull()
    const company = workspace?.exhibitors.find((item) => item.id === ids.company)

    expect(company).toMatchObject({
      id: ids.company,
      displayName: "Acme Exhibitor Co",
      contactEmail: "seller-a@test.local",
      boothCount: 2,
      boothRefs: ["A-01", "B-01"],
      tierMix: { Basic: 1, Professional: 0, Premium: 1 },
      publishedBoothCount: 1,
      productCount: 3,
      paidAmount: 1000000,
      paymentStatus: "Paid"
    })
  })

  test("falls back to seller identity when company is missing", async () => {
    const workspace = await getPartnerExpoExhibitors(ids.partnerUser, ids.expo)

    const fallback = workspace?.exhibitors.find(
      (item) => item.id === ids.fallbackSeller
    )

    expect(fallback).toMatchObject({
      id: ids.fallbackSeller,
      displayName: "Fallback Seller",
      contactEmail: "fallback@test.local",
      boothCount: 1,
      paymentStatus: "Pending"
    })
  })

  test("blocks unassigned partner users", async () => {
    const workspace = await getPartnerExpoExhibitors(ids.outsiderUser, ids.expo)

    expect(workspace).toBeNull()
  })
})

describe("getPartnerExpoExhibitorDetail", () => {
  test("returns registrations and orders for selected exhibitor", async () => {
    const detail = await getPartnerExpoExhibitorDetail(
      ids.partnerUser,
      ids.expo,
      ids.company
    )

    expect(detail?.exhibitor.displayName).toBe("Acme Exhibitor Co")
    expect(detail?.registrations.map((item) => item.id).sort()).toEqual([
      ids.regA,
      ids.regB
    ])
    expect(detail?.orders.map((item) => item.id).sort()).toEqual([
      ids.orderA,
      ids.orderB
    ])
  })

  test("returns null for unassigned partner users", async () => {
    const detail = await getPartnerExpoExhibitorDetail(
      ids.outsiderUser,
      ids.expo,
      ids.company
    )

    expect(detail).toBeNull()
  })
})
