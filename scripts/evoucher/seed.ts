import { sql } from "@/lib/db/neon"
import {
  mockVoucherBatches,
  mockVoucherCodes,
  mockVoucherTargets
} from "@/scripts/fixtures/evoucher"

async function ensureSchema() {
  await sql`
    create table if not exists voucher_targets (
      id text primary key,
      name text not null,
      type text not null
    )
  `

  await sql`
    create table if not exists voucher_batches (
      id text primary key,
      code_type text not null,
      code_prefix text not null,
      multi_use_code text not null,
      multi_use_locked_count int not null default 0,
      multi_use_redeemed_count int not null default 0,
      name text not null,
      applicable_to text not null,
      target_id text not null,
      target_name text not null,
      assigned_to_partner_id text not null,
      assigned_to_partner_name text not null,
      valid_from date not null,
      valid_until date not null,
      issued_quantity int not null,
      discount_type text not null,
      discount_value numeric not null,
      description text null,
      is_revoked boolean not null default false,
      created_at timestamptz not null,
      updated_at timestamptz not null
    )
  `

  await sql`
    create table if not exists voucher_codes (
      id text primary key,
      batch_id text not null references voucher_batches(id) on delete cascade,
      code text not null unique,
      status text not null,
      locked_by_order_id text null,
      redeemed_at timestamptz null
    )
  `

  await sql`
    create index if not exists voucher_codes_batch_id_idx on voucher_codes(batch_id)
  `
  await sql`
    create index if not exists voucher_batches_updated_at_idx
    on voucher_batches(updated_at desc)
  `
  await sql`
    create index if not exists voucher_codes_status_id_idx
    on voucher_codes(status, id asc)
  `
  await sql`
    create index if not exists voucher_targets_type_name_idx
    on voucher_targets(type asc, name asc)
  `
}

async function clearData() {
  await sql`truncate table voucher_codes cascade`
  await sql`truncate table voucher_batches cascade`
  await sql`truncate table voucher_targets cascade`
}

export async function seedEVoucher() {
  await ensureSchema()
  await clearData()

  for (const target of mockVoucherTargets) {
    await sql`
      insert into voucher_targets (id, name, type)
      values (${target.id}, ${target.name}, ${target.type})
    `
  }

  for (const batch of mockVoucherBatches) {
    await sql`
      insert into voucher_batches (
        id,
        code_type,
        code_prefix,
        multi_use_code,
        multi_use_locked_count,
        multi_use_redeemed_count,
        name,
        applicable_to,
        target_id,
        target_name,
        assigned_to_partner_id,
        assigned_to_partner_name,
        valid_from,
        valid_until,
        issued_quantity,
        discount_type,
        discount_value,
        description,
        is_revoked,
        created_at,
        updated_at
      ) values (
        ${batch.id},
        ${batch.codeType},
        ${batch.codePrefix},
        ${batch.multiUseCode},
        ${batch.multiUseLockedCount},
        ${batch.multiUseRedeemedCount},
        ${batch.name},
        ${batch.applicableTo},
        ${batch.targetId},
        ${batch.targetName},
        ${batch.assignedToPartnerId},
        ${batch.assignedToPartnerName},
        ${batch.validFrom},
        ${batch.validUntil},
        ${batch.issuedQuantity},
        ${batch.discountType},
        ${batch.discountValue},
        ${batch.description ?? null},
        ${batch.isRevoked},
        ${new Date(batch.createdAt)},
        ${new Date(batch.updatedAt)}
      )
    `
  }

  for (const code of mockVoucherCodes) {
    await sql`
      insert into voucher_codes (
        id,
        batch_id,
        code,
        status,
        locked_by_order_id,
        redeemed_at
      ) values (
        ${code.id},
        ${code.batchId},
        ${code.code},
        ${code.status},
        ${code.lockedByOrderId ?? null},
        ${code.redeemedAt ? new Date(code.redeemedAt) : null}
      )
    `
  }
}

if (import.meta.main) {
  await seedEVoucher()
  // eslint-disable-next-line no-console
  console.log("eVoucher seed complete.")
}
