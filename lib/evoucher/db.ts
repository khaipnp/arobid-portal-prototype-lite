import { sql } from "@/lib/db/neon"
import type {
  VoucherBatch,
  VoucherCode,
  VoucherTarget
} from "@/lib/evoucher/types"

type VoucherBatchRow = {
  id: string
  code_type: VoucherBatch["codeType"]
  code_prefix: string
  multi_use_code: string
  multi_use_locked_count: number
  multi_use_redeemed_count: number
  name: string
  applicable_to: VoucherBatch["applicableTo"]
  target_id: string
  target_name: string
  assigned_to_partner_id: string
  assigned_to_partner_name: string
  valid_from: string | Date
  valid_until: string | Date
  issued_quantity: number
  discount_type: VoucherBatch["discountType"]
  discount_value: number
  description: string | null
  is_revoked: boolean
  created_at: string | Date
  updated_at: string | Date
}

type VoucherCodeRow = {
  id: string
  batch_id: string
  code: string
  status: VoucherCode["status"]
  locked_by_order_id: string | null
  redeemed_at: string | Date | null
}

type VoucherTargetRow = {
  id: string
  name: string
  type: VoucherTarget["type"]
}

function toIsoDate(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10)
}

function toIsoDateTime(value: string | Date) {
  return new Date(value).toISOString()
}

function mapBatch(row: VoucherBatchRow): VoucherBatch {
  return {
    id: row.id,
    codeType: row.code_type,
    codePrefix: row.code_prefix,
    multiUseCode: row.multi_use_code,
    multiUseLockedCount: Number(row.multi_use_locked_count),
    multiUseRedeemedCount: Number(row.multi_use_redeemed_count),
    name: row.name,
    applicableTo: row.applicable_to,
    targetId: row.target_id,
    targetName: row.target_name,
    assignedToPartnerId: row.assigned_to_partner_id,
    assignedToPartnerName: row.assigned_to_partner_name,
    validFrom: toIsoDate(row.valid_from),
    validUntil: toIsoDate(row.valid_until),
    issuedQuantity: Number(row.issued_quantity),
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    description: row.description ?? undefined,
    isRevoked: row.is_revoked,
    createdAt: toIsoDateTime(row.created_at),
    updatedAt: toIsoDateTime(row.updated_at)
  }
}

function mapCode(row: VoucherCodeRow): VoucherCode {
  return {
    id: row.id,
    batchId: row.batch_id,
    code: row.code,
    status: row.status,
    lockedByOrderId: row.locked_by_order_id ?? undefined,
    redeemedAt: row.redeemed_at ? toIsoDateTime(row.redeemed_at) : undefined
  }
}

function mapTarget(row: VoucherTargetRow): VoucherTarget {
  return {
    id: row.id,
    name: row.name,
    type: row.type
  }
}

export async function listVoucherBatches(): Promise<VoucherBatch[]> {
  const rows = (await sql`
    select * from voucher_batches
    order by updated_at desc
  `) as VoucherBatchRow[]
  return rows.map(mapBatch)
}

export async function listVoucherCodes(): Promise<VoucherCode[]> {
  const rows = (await sql`
    select * from voucher_codes
    order by id asc
  `) as VoucherCodeRow[]
  return rows.map(mapCode)
}

export async function listVoucherTargets(): Promise<VoucherTarget[]> {
  const rows = (await sql`
    select * from voucher_targets
    order by type asc, name asc
  `) as VoucherTargetRow[]
  return rows.map(mapTarget)
}
