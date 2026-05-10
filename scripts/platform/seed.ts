import { resolve } from "node:path"
import { config } from "dotenv"

config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

async function clearPlatformTables() {
  const { sql } = await import("@/lib/db/neon")
  await sql`truncate table chat_unread_counts cascade`
  await sql`truncate table chat_messages cascade`
  await sql`truncate table chat_conversation_members cascade`
  await sql`truncate table chat_conversations cascade`
  await sql`truncate table chat_users cascade`
  await sql`truncate table transaction_log cascade`
  await sql`truncate table orders cascade`
  await sql`truncate table expo_payment_configs cascade`
  await sql`truncate table platform_payment_config cascade`
  await sql`truncate table bank_accounts cascade`
  await sql`truncate table live_comments cascade`
  await sql`truncate table go_live_events cascade`
  await sql`truncate table stream_sessions cascade`
  await sql`truncate table booth_customizations cascade`
  await sql`truncate table seller_booth_registrations cascade`
  await sql`truncate table expo_booth_template_assignments cascade`
  await sql`truncate table admin_notifications cascade`
  await sql`truncate table company_products cascade`
  await sql`truncate table company_categories cascade`
  await sql`truncate table booth_template_customization_configs cascade`
  await sql`truncate table expos cascade`
  await sql`truncate table expo_categories cascade`
  await sql`truncate table exhibitor_categories cascade`
}

export async function seedPlatform() {
  const { ensureDemoAccounts } = await import("@/lib/auth/service")
  const { ensurePlatformSchema } = await import("@/lib/platform/ensure-schema")
  const { sql } = await import("@/lib/db/neon")

  console.log("Initializing platform schema...")
  await ensurePlatformSchema()

  console.log("Cleaning up old data...")
  await clearPlatformTables()

  const {
    mockBoothCustomizations,
    mockBoothTemplateCustomizationConfigs,
    mockExhibitorCatalogProducts,
    mockExpoBoothTemplateAssignments,
    mockExpoCategories,
    mockExpos,
    mockGoLIVEEvents,
    mockLiveComments,
    mockNotifications,
    mockSellerRegistrations,
    mockStreamSessions
  } = await import("@/scripts/fixtures/tradexpo")
  const {
    mockBankAccounts,
    mockExpoPaymentConfigs,
    mockOrders,
    mockPaymentConfig,
    mockTransactionLog
  } = await import("@/scripts/fixtures/orders")
  const { DEAL_ROOM_CURRENT_USER_ID } = await import(
    "@/lib/deal-room/constants"
  )
  const {
    mockChatUsers,
    mockConversations,
    mockInitialUnreadCounts,
    mockMessages
  } = await import("@/scripts/fixtures/deal-room")

  console.log("Seeding Expo Categories...")
  for (const c of mockExpoCategories) {
    await sql`
      insert into expo_categories (id, name, level, parent_id)
      values (${c.id}, ${c.name}, 1, null)
    `
  }

  console.log("Seeding Expos...")
  for (const e of mockExpos) {
    await sql`
      insert into expos (
        id, name, thumbnail_url, owner_email, start_date, end_date,
        status, category_ids, created_at, description, timezone
      ) values (
        ${e.id}, ${e.name}, ${e.thumbnailUrl}, ${e.ownerEmail},
        ${e.startDate}, ${e.endDate}, ${e.status},
        ${JSON.stringify(e.categoryIds)}::jsonb,
        ${new Date(e.createdAt)},
        ${e.description ?? ""},
        ${e.timezone ?? "Asia/Bangkok"}
      )
    `
  }

  console.log("Seeding Companies & Products (Core)...")
  await sql`
    insert into companies (id, name, website, address)
    values ('comp-' || encode(sha256('Arobid'::bytea), 'hex'), 'Arobid', 'https://arobid.com', 'Ho Chi Minh City, Vietnam')
    on conflict (id) do nothing
  `

  for (const p of mockExhibitorCatalogProducts) {
    await sql`
      insert into company_products (id, company_id, name, description, main_image_url, price, currency, is_active)
      values (
        ${p.id},
        'comp-' || encode(sha256('Arobid'::bytea), 'hex'),
        ${p.name},
        ${p.description},
        ${p.imageUrl ?? null},
        ${Math.floor(Math.random() * 1000) * 1000 + 50000},
        'VND',
        true
      )
    `
  }
  console.log("Seeding Chat Users & Syncing to Users...")
  for (const u of mockChatUsers) {
    if (u.company) {
      await sql`
        insert into companies (id, name, address)
        values ('comp-' || encode(sha256(${u.company}::bytea), 'hex'), ${u.company}, ${u.location ?? "Vietnam"})
        on conflict (id) do nothing
      `
    }

    await sql`
      insert into chat_users (
        id, name, email, company_id, job_title, phone, website, location, avatar_url, is_active
      ) values (
        ${u.id}, ${u.name}, ${u.email},
        case when ${u.company}::text is not null and ${u.company}::text <> '' then 'comp-' || encode(sha256(${u.company}::bytea), 'hex') else null end,
        ${u.jobTitle ?? null},
        ${u.phone ?? null}, ${u.website ?? null}, ${u.location ?? null},
        ${u.avatarUrl ?? null}, ${u.isActive}
      )
    `
  }
  await sql`
    insert into users (
      id, name, email, company_id, job_title, phone, website, location, avatar_url, is_active
    )
    select
      id, name, email, company_id, job_title, phone, website, location, avatar_url, is_active
    from chat_users
    on conflict (id) do update set
      name = excluded.name,
      email = excluded.email,
      company_id = excluded.company_id,
      job_title = excluded.job_title,
      phone = excluded.phone,
      website = excluded.website,
      location = excluded.location,
      avatar_url = excluded.avatar_url,
      is_active = excluded.is_active
  `

  console.log("Seeding Demo Accounts...")
  await ensureDemoAccounts()

  console.log("Seeding Orders & Transactions...")
  for (const o of mockOrders) {
    await sql`
      insert into orders (
        id, customer_id, customer_name, customer_email, customer_company,
        partner_name, order_type, reference_id, expo_name, booth_ref, booth_tier,
        original_amount, discount_amount, amount, voucher_id, payment_method, status,
        invoice_requested, invoice_type, billing_info_snapshot, invoice_status, paid_at,
        created_at, updated_at
      ) values (
        ${o.id}, ${o.customerId}, ${o.customerName}, ${o.customerEmail}, ${o.customerCompany},
        ${o.partnerName ?? null}, ${o.orderType}, ${o.referenceId}, ${o.expoName ?? null}, ${o.boothRef ?? null}, ${o.boothTier ?? null},
        ${o.originalAmount}, ${o.discountAmount}, ${o.amount}, ${o.voucherId ?? null}, ${o.paymentMethod}, ${o.status},
        ${o.invoiceRequested}, ${o.invoiceType ?? null}, ${JSON.stringify(o.billingInfoSnapshot ?? null)}::jsonb, ${o.invoiceStatus}, ${o.paidAt ? new Date(o.paidAt) : null},
        ${new Date(o.createdAt)}, ${new Date(o.updatedAt)}
      )
    `
  }

  console.log("Seeding Booth Registrations & Customizations...")
  for (const r of mockSellerRegistrations) {
    await sql`
      insert into seller_booth_registrations (
        id, user_id, expo_id, slot_id, booth_template_id, booth_ref, booth_tier, status, purchased_at
      ) values (
        ${r.id}, ${r.userId}, ${r.expoId}, ${r.slotId ?? null}, ${r.boothTemplateId ?? null},
        ${r.boothRef}, ${r.boothTier}, ${r.status}, ${new Date(r.purchasedAt)}
      )
    `
  }

  for (const c of mockBoothCustomizations) {
    await sql`
      insert into booth_customizations (
        registration_id, selected_booth_template_id, publish_status,
        colors, logo_url, image_urls, video_type, video_url, products
      ) values (
        ${c.registrationId}, ${c.selectedBoothTemplateId ?? null}, ${c.publishStatus},
        ${JSON.stringify(c.colors)}::jsonb, ${c.logoUrl},
        ${JSON.stringify(c.imageUrls)}::jsonb, ${c.videoType ?? null}, ${c.videoUrl},
        ${JSON.stringify(c.products)}::jsonb
      )
    `
  }

  console.log("Seeding Chat Conversations & Messages...")
  for (const conv of mockConversations) {
    await sql`
      insert into chat_conversations (id, type, created_at, is_read_only)
      values (${conv.id}, ${conv.type}, ${new Date(conv.createdAt)}, ${conv.isReadOnly})
    `
    for (const m of conv.members) {
      await sql`
        insert into chat_conversation_members (
          conversation_id, user_id, joined_at, is_archived
        ) values (
          ${conv.id}, ${m.userId}, ${new Date(m.joinedAt)}, ${m.isArchived}
        )
      `
    }
  }

  for (const [convId, msgs] of Object.entries(mockMessages)) {
    for (const msg of msgs) {
      await sql`
        insert into chat_messages (
          id, conversation_id, sender_id, content, attachments, status,
          sent_at, edited_at, is_deleted, is_system_message
        ) values (
          ${msg.id}, ${convId}, ${msg.senderId}, ${msg.content},
          ${JSON.stringify(msg.attachments)}::jsonb, ${msg.status},
          ${new Date(msg.sentAt)},
          ${msg.editedAt ? new Date(msg.editedAt) : null},
          ${msg.isDeleted}, ${msg.isSystemMessage}
        )
      `
    }
  }

  console.log("Master platform seed complete.")
}
if (import.meta.main) {
  await seedPlatform()
  // eslint-disable-next-line no-console
  console.log("Platform seed complete.")
}
