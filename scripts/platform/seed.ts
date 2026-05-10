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
  await sql`truncate table exhibitor_catalog_products cascade`
  await sql`truncate table booth_template_customization_configs cascade`
  await sql`truncate table expos cascade`
  await sql`truncate table expo_categories cascade`
}

export async function seedPlatform() {
  const { ensurePlatformSchema } = await import("@/lib/platform/ensure-schema")
  const { sql } = await import("@/lib/db/neon")
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
  } = await import("@/lib/tradexpo/mock-data")
  const {
    mockBankAccounts,
    mockExpoPaymentConfigs,
    mockOrders,
    mockPaymentConfig,
    mockTransactionLog
  } = await import("@/lib/orders/mock-data")
  const { DEAL_ROOM_CURRENT_USER_ID } = await import(
    "@/lib/deal-room/constants"
  )
  const {
    mockChatUsers,
    mockConversations,
    mockInitialUnreadCounts,
    mockMessages
  } = await import("@/lib/deal-room/mock-data")

  await ensurePlatformSchema()
  await clearPlatformTables()

  for (const c of mockExpoCategories) {
    await sql`
      insert into expo_categories (id, name, level, parent_id)
      values (${c.id}, ${c.name}, 1, null)
    `
  }

  for (const e of mockExpos) {
    await sql`
      insert into expos (
        id, name, thumbnail_url, owner_email, start_date, end_date,
        status, category_ids, created_at
      ) values (
        ${e.id}, ${e.name}, ${e.thumbnailUrl}, ${e.ownerEmail},
        ${e.startDate}, ${e.endDate}, ${e.status},
        ${JSON.stringify(e.categoryIds)}::jsonb,
        ${new Date(e.createdAt)}
      )
    `
  }

  for (const n of mockNotifications) {
    await sql`
      insert into admin_notifications (
        id, kind, title, message, related_expo_id, created_at, is_read
      ) values (
        ${n.id}, ${n.kind}, ${n.title}, ${n.message},
        ${n.relatedExpoId ?? null}, ${new Date(n.createdAt)}, ${n.isRead}
      )
    `
  }

  for (const a of mockExpoBoothTemplateAssignments) {
    await sql`
      insert into expo_booth_template_assignments (expo_id, booth_template_ids)
      values (${a.expoId}, ${JSON.stringify(a.boothTemplateIds)}::jsonb)
    `
  }

  for (const cfg of mockBoothTemplateCustomizationConfigs) {
    await sql`
      insert into booth_template_customization_configs (
        booth_template_id, color_slots, image_slots, product_limit, has_video
      ) values (
        ${cfg.boothTemplateId}, ${cfg.colorSlots}, ${cfg.imageSlots},
        ${cfg.productLimit}, ${cfg.hasVideo}
      )
    `
  }

  for (const p of mockExhibitorCatalogProducts) {
    await sql`
      insert into exhibitor_catalog_products (id, name, description, image_url)
      values (${p.id}, ${p.name}, ${p.description}, ${p.imageUrl ?? null})
    `
  }

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

  for (const s of mockStreamSessions) {
    await sql`
      insert into stream_sessions (
        stream_session_id, status, host_user_id, host_display_name,
        stream_url, stream_key, replay_enabled, replay_url,
        started_at, ended_at, peak_viewer_count, created_at, updated_at
      ) values (
        ${s.streamSessionId}, ${s.status}, ${s.hostUserId}, ${s.hostDisplayName},
        ${s.streamUrl}, ${s.streamKey}, ${s.replayEnabled}, ${s.replayUrl},
        ${s.startedAt ? new Date(s.startedAt) : null},
        ${s.endedAt ? new Date(s.endedAt) : null},
        ${s.peakViewerCount}, ${new Date(s.createdAt)}, ${new Date(s.updatedAt)}
      )
    `
  }

  for (const c of mockLiveComments) {
    await sql`
      insert into live_comments (
        live_comment_id, stream_session_id, author_user_id, author_display_name,
        guest_display_name, guest_email, comment_text, is_deleted,
        created_at, deleted_at, deleted_by_user_id
      ) values (
        ${c.liveCommentId}, ${c.streamSessionId}, ${c.authorUserId ?? null},
        ${c.authorDisplayName ?? null}, ${c.guestDisplayName ?? null},
        ${c.guestEmail ?? null}, ${c.commentText}, ${c.isDeleted},
        ${new Date(c.createdAt)},
        ${c.deletedAt ? new Date(c.deletedAt) : null},
        ${c.deletedByUserId ?? null}
      )
    `
  }

  for (const g of mockGoLIVEEvents) {
    await sql`
      insert into go_live_events (
        go_live_event_id, expo_id, stream_session_id, title, description,
        thumbnail_url, session_type, scheduled_start_at, status,
        broadcaster_user_id, broadcaster_display_name, created_at, updated_at
      ) values (
        ${g.goLiveEventId}, ${g.expoId}, ${g.streamSessionId}, ${g.title},
        ${g.description ?? null}, ${g.thumbnailUrl ?? null}, ${g.sessionType},
        ${g.scheduledStartAt ? new Date(g.scheduledStartAt) : null},
        ${g.status}, ${g.broadcasterUserId}, ${g.broadcasterDisplayName},
        ${new Date(g.createdAt)}, ${new Date(g.updatedAt)}
      )
    `
  }

  for (const b of mockBankAccounts) {
    await sql`
      insert into bank_accounts (
        id, bank_name, bank_bin, account_number, account_holder_name,
        branch, is_primary, is_active, created_at, updated_at
      ) values (
        ${b.id}, ${b.bankName}, ${b.bankBIN}, ${b.accountNumber}, ${b.accountHolderName},
        ${b.branch ?? null}, ${b.isPrimary}, ${b.isActive},
        ${new Date(b.createdAt)}, ${new Date(b.updatedAt)}
      )
    `
  }

  await sql`
    insert into platform_payment_config (
      id, vnpay_enabled, bank_transfer_enabled, updated_at, updated_by
    ) values (
      'default', ${mockPaymentConfig.vnpayEnabled}, ${mockPaymentConfig.bankTransferEnabled},
      ${new Date(mockPaymentConfig.updatedAt)}, ${mockPaymentConfig.updatedBy}
    )
  `

  for (const p of mockExpoPaymentConfigs) {
    await sql`
      insert into expo_payment_configs (
        expo_id, is_inherited, vnpay_enabled, bank_transfer_enabled,
        bank_account_id, updated_at, updated_by
      ) values (
        ${p.expoId}, ${p.isInherited}, ${p.vnpayEnabled}, ${p.bankTransferEnabled},
        ${p.bankAccountId}, ${new Date(p.updatedAt)}, ${p.updatedBy}
      )
    `
  }

  for (const o of mockOrders) {
    await sql`
      insert into orders (
        id, customer_id, customer_name, customer_email, customer_company,
        partner_name, order_type, reference_id, expo_name, booth_ref, booth_tier,
        original_amount, discount_amount, amount, voucher_id, payment_method, status,
        invoice_requested, invoice_type, billing_info_snapshot, invoice_status, paid_at,
        exported_at, exported_by, export_batch_id, issued_at, issued_by, sent_at, sent_by,
        expires_at, created_at, updated_at
      ) values (
        ${o.id}, ${o.customerId}, ${o.customerName}, ${o.customerEmail}, ${o.customerCompany},
        ${o.partnerName ?? null}, ${o.orderType}, ${o.referenceId}, ${o.expoName ?? null}, ${o.boothRef ?? null}, ${o.boothTier ?? null},
        ${o.originalAmount}, ${o.discountAmount}, ${o.amount}, ${o.voucherId ?? null}, ${o.paymentMethod}, ${o.status},
        ${o.invoiceRequested}, ${o.invoiceType ?? null}, ${JSON.stringify(o.billingInfoSnapshot ?? null)}::jsonb, ${o.invoiceStatus}, ${o.paidAt ? new Date(o.paidAt) : null},
        ${o.exportedAt ? new Date(o.exportedAt) : null}, ${o.exportedBy ?? null}, ${o.exportBatchId ?? null},
        ${o.issuedAt ? new Date(o.issuedAt) : null}, ${o.issuedBy ?? null},
        ${o.sentAt ? new Date(o.sentAt) : null}, ${o.sentBy ?? null},
        ${o.expiresAt ? new Date(o.expiresAt) : null},
        ${new Date(o.createdAt)}, ${new Date(o.updatedAt)}
      )
    `
  }

  for (const t of mockTransactionLog) {
    await sql`
      insert into transaction_log (
        id, order_id, type, status, actor, note, rejection_reason, processed_at
      ) values (
        ${t.id}, ${t.orderId}, ${t.type}, ${t.status}, ${t.actor},
        ${t.note ?? null}, ${t.rejectionReason ?? null}, ${new Date(t.processedAt)}
      )
    `
  }

  await sql`
    update orders
    set
      status = 'Cancelled',
      updated_at = now()
    where status in ('Failed', 'Expired', 'Cancel')
  `

  await sql`
    update transaction_log
    set status = 'Cancelled'
    where status in ('Failed', 'Expired', 'Cancel')
  `

  for (const u of mockChatUsers) {
    await sql`
      insert into chat_users (
        id, name, email, company, job_title, phone, website, location, avatar_url, is_active
      ) values (
        ${u.id}, ${u.name}, ${u.email}, ${u.company}, ${u.jobTitle ?? null},
        ${u.phone ?? null}, ${u.website ?? null}, ${u.location ?? null},
        ${u.avatarUrl ?? null}, ${u.isActive}
      )
    `
  }

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

  for (const [convId, count] of Object.entries(mockInitialUnreadCounts)) {
    await sql`
      insert into chat_unread_counts (user_id, conversation_id, unread_count)
      values (${DEAL_ROOM_CURRENT_USER_ID}, ${convId}, ${count})
    `
  }
}

if (import.meta.main) {
  await seedPlatform()
  // eslint-disable-next-line no-console
  console.log("Platform seed complete.")
}
