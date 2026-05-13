import { resolve } from "node:path"
import { config } from "dotenv"

config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

export async function seedSellerDemoExpos() {
  const { ensureDemoAccounts } = await import("@/lib/auth/service")
  const { sql } = await import("@/lib/db/neon")
  const { ensurePlatformSchema } = await import("@/lib/platform/ensure-schema")
  const {
    mockBoothCustomizations,
    mockExpos,
    mockSellerRegistrations,
    SELLER_DEMO_USER_ID
  } = await import("@/scripts/fixtures/tradexpo")
  const { mockOrders } = await import("@/scripts/fixtures/orders")

  console.log("Initializing platform schema...")
  await ensurePlatformSchema()

  console.log("Ensuring demo accounts...")
  await ensureDemoAccounts()

  const demoRegistrations = mockSellerRegistrations.filter(
    (registration) => registration.userId === SELLER_DEMO_USER_ID
  )
  const demoRegistrationIds = new Set(
    demoRegistrations.map((registration) => registration.id)
  )
  const demoExpoIds = new Set(
    demoRegistrations.map((registration) => registration.expoId)
  )
  const demoExpos = mockExpos.filter((expo) => demoExpoIds.has(expo.id))
  const demoCustomizations = mockBoothCustomizations.filter((customization) =>
    demoRegistrationIds.has(customization.registrationId)
  )
  const demoOrders = mockOrders.filter(
    (order) => order.customerId === SELLER_DEMO_USER_ID
  )

  console.log("Cleaning stale seller demo booth rows...")
  await sql`
    delete from seller_booth_registrations
    where user_id = ${SELLER_DEMO_USER_ID}
      and not (id = any(${Array.from(demoRegistrationIds)}::text[]))
  `

  console.log(`Upserting ${demoExpos.length} demo expos...`)
  for (const expo of demoExpos) {
    await sql`
      insert into expos (
        id, name, thumbnail_url, owner_email, start_date, end_date,
        status, category_ids, created_at, description, timezone
      ) values (
        ${expo.id}, ${expo.name}, ${expo.thumbnailUrl}, ${expo.ownerEmail},
        ${expo.startDate}, ${expo.endDate}, ${expo.status},
        ${JSON.stringify(expo.categoryIds)}::jsonb,
        ${new Date(expo.createdAt)},
        ${expo.description ?? ""},
        ${expo.timezone ?? "Asia/Bangkok"}
      )
      on conflict (id) do update set
        name = excluded.name,
        thumbnail_url = excluded.thumbnail_url,
        owner_email = excluded.owner_email,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        status = excluded.status,
        category_ids = excluded.category_ids,
        description = excluded.description,
        timezone = excluded.timezone
    `
  }

  console.log(`Upserting ${demoRegistrations.length} booth registrations...`)
  for (const registration of demoRegistrations) {
    await sql`
      insert into seller_booth_registrations (
        id, user_id, expo_id, slot_id, booth_template_id, booth_ref,
        booth_tier, status, purchased_at
      ) values (
        ${registration.id},
        ${registration.userId},
        ${registration.expoId},
        ${registration.slotId ?? null},
        ${registration.boothTemplateId ?? null},
        ${registration.boothRef},
        ${registration.boothTier},
        ${registration.status},
        ${new Date(registration.purchasedAt)}
      )
      on conflict (id) do update set
        user_id = excluded.user_id,
        expo_id = excluded.expo_id,
        slot_id = excluded.slot_id,
        booth_template_id = excluded.booth_template_id,
        booth_ref = excluded.booth_ref,
        booth_tier = excluded.booth_tier,
        status = excluded.status,
        purchased_at = excluded.purchased_at
    `
  }

  console.log(`Upserting ${demoCustomizations.length} booth customizations...`)
  for (const customization of demoCustomizations) {
    await sql`
      insert into booth_customizations (
        registration_id, selected_booth_template_id, publish_status,
        colors, logo_url, image_urls, video_type, video_url, products
      ) values (
        ${customization.registrationId},
        ${customization.selectedBoothTemplateId ?? null},
        ${customization.publishStatus},
        ${JSON.stringify(customization.colors)}::jsonb,
        ${customization.logoUrl},
        ${JSON.stringify(customization.imageUrls)}::jsonb,
        ${customization.videoType ?? null},
        ${customization.videoUrl},
        ${JSON.stringify(customization.products)}::jsonb
      )
      on conflict (registration_id) do update set
        selected_booth_template_id = excluded.selected_booth_template_id,
        publish_status = excluded.publish_status,
        colors = excluded.colors,
        logo_url = excluded.logo_url,
        image_urls = excluded.image_urls,
        video_type = excluded.video_type,
        video_url = excluded.video_url,
        products = excluded.products
    `
  }

  console.log(`Upserting ${demoOrders.length} demo orders...`)
  for (const order of demoOrders) {
    await sql`
      insert into orders (
        id, customer_id, customer_name, customer_email, customer_company,
        partner_name, order_type, reference_id, expo_name, booth_ref,
        booth_tier, original_amount, discount_amount, amount, voucher_id,
        payment_method, status, invoice_requested, invoice_type,
        billing_info_snapshot, invoice_status, paid_at, expires_at,
        created_at, updated_at
      ) values (
        ${order.id},
        ${order.customerId},
        ${order.customerName},
        ${order.customerEmail},
        ${order.customerCompany},
        ${order.partnerName ?? null},
        ${order.orderType},
        ${order.referenceId},
        ${order.expoName ?? null},
        ${order.boothRef ?? null},
        ${order.boothTier ?? null},
        ${order.originalAmount},
        ${order.discountAmount},
        ${order.amount},
        ${order.voucherId ?? null},
        ${order.paymentMethod},
        ${order.status},
        ${order.invoiceRequested},
        ${order.invoiceType ?? null},
        ${JSON.stringify(order.billingInfoSnapshot ?? null)}::jsonb,
        ${order.invoiceStatus},
        ${order.paidAt ? new Date(order.paidAt) : null},
        ${order.expiresAt ? new Date(order.expiresAt) : null},
        ${new Date(order.createdAt)},
        ${new Date(order.updatedAt)}
      )
      on conflict (id) do update set
        customer_id = excluded.customer_id,
        customer_name = excluded.customer_name,
        customer_email = excluded.customer_email,
        customer_company = excluded.customer_company,
        partner_name = excluded.partner_name,
        order_type = excluded.order_type,
        reference_id = excluded.reference_id,
        expo_name = excluded.expo_name,
        booth_ref = excluded.booth_ref,
        booth_tier = excluded.booth_tier,
        original_amount = excluded.original_amount,
        discount_amount = excluded.discount_amount,
        amount = excluded.amount,
        voucher_id = excluded.voucher_id,
        payment_method = excluded.payment_method,
        status = excluded.status,
        invoice_requested = excluded.invoice_requested,
        invoice_type = excluded.invoice_type,
        billing_info_snapshot = excluded.billing_info_snapshot,
        invoice_status = excluded.invoice_status,
        paid_at = excluded.paid_at,
        expires_at = excluded.expires_at,
        updated_at = excluded.updated_at
    `
  }

  console.log("Seller demo Expo seed complete.")
}

if (import.meta.main) {
  await seedSellerDemoExpos()
}
