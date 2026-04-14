import type {
  VoucherBatch,
  VoucherBatchStatus,
  VoucherBatchView,
  VoucherCode,
} from "./types"

export function deriveVoucherBatchStatus(
  batch: VoucherBatch,
  lockedCount: number,
  redeemedCount: number,
): VoucherBatchStatus {
  if (batch.isRevoked) return "Revoked"
  const remaining = batch.issuedQuantity - lockedCount - redeemedCount
  if (remaining <= 0) return "Depleted"
  const now = new Date()
  const until = new Date(batch.validUntil)
  if (until < now) return "Expired"
  return "Active"
}

export function buildVoucherBatchView(
  batch: VoucherBatch,
  codes: VoucherCode[],
): VoucherBatchView {
  let lockedCount: number
  let redeemedCount: number

  if (batch.codeType === "multi-use") {
    // Multi-use: counters stored directly on the batch
    lockedCount = batch.multiUseLockedCount
    redeemedCount = batch.multiUseRedeemedCount
  } else {
    // Single-use: derive from individual code records
    const batchCodes = codes.filter((c) => c.batchId === batch.id)
    lockedCount = batchCodes.filter((c) => c.status === "Locked").length
    redeemedCount = batchCodes.filter((c) => c.status === "Redeemed").length
  }

  const remainingCount = batch.issuedQuantity - lockedCount - redeemedCount
  const derivedStatus = deriveVoucherBatchStatus(batch, lockedCount, redeemedCount)
  return { ...batch, lockedCount, redeemedCount, remainingCount, derivedStatus }
}

export function formatDiscount(type: VoucherBatch["discountType"], value: number): string {
  if (type === "percentage") return `${value}%`
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function generateSuffix(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export function generateCodes(
  batchId: string,
  prefix: string,
  quantity: number,
  existingCodes: Set<string> = new Set(),
): VoucherCode[] {
  const codes: VoucherCode[] = []
  let attempts = 0
  while (codes.length < quantity && attempts < quantity * 10) {
    attempts++
    const suffix = generateSuffix()
    const code = `${prefix.toUpperCase()}-${suffix}`
    if (!existingCodes.has(code)) {
      existingCodes.add(code)
      codes.push({
        id: `code-${batchId}-${codes.length + 1}`,
        batchId,
        code,
        status: "Available",
      })
    }
  }
  return codes
}

export function applyDiscount(
  orderTotal: number,
  type: VoucherBatch["discountType"],
  value: number,
): number {
  if (type === "percentage") {
    return Math.round(orderTotal * (1 - value / 100))
  }
  return Math.max(0, orderTotal - value)
}

/** Display label for the code column: prefix-* for single-use, the code itself for multi-use */
export function displayCode(batch: VoucherBatch): string {
  return batch.codeType === "multi-use" ? batch.multiUseCode : `${batch.codePrefix}-*`
}
