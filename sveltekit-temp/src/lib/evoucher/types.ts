export type VoucherBatchStatus = "Active" | "Expired" | "Depleted" | "Revoked"
export type VoucherScope = "service" | "expo"
export type DiscountType = "percentage" | "fixed"
export type VoucherCodeStatus = "Available" | "Locked" | "Redeemed" | "Revoked"
export type VoucherCodeType = "single-use" | "multi-use"

export interface VoucherPartner {
  id: string
  name: string
}

export interface VoucherTarget {
  id: string
  name: string
  type: VoucherScope
}

export interface VoucherBatch {
  id: string
  codeType: VoucherCodeType
  // single-use: prefix used to seed generation (e.g. "EXPO2025")
  codePrefix: string
  // multi-use: the single shared code (e.g. "SUMMER25"). Empty string for single-use.
  multiUseCode: string
  // multi-use counters (stored directly; single-use derives from VoucherCode array)
  multiUseLockedCount: number
  multiUseRedeemedCount: number
  name: string
  applicableTo: VoucherScope
  targetId: string
  targetName: string
  assignedToPartnerId: string
  assignedToPartnerName: string
  validFrom: string // ISO date
  validUntil: string // ISO date
  issuedQuantity: number
  discountType: DiscountType
  discountValue: number
  description?: string
  isRevoked: boolean
  createdAt: string
  updatedAt: string
}

export interface VoucherCode {
  id: string
  batchId: string
  code: string
  status: VoucherCodeStatus
  lockedByOrderId?: string
  redeemedAt?: string
}

// Derived for display/logic
export interface VoucherBatchView extends VoucherBatch {
  lockedCount: number
  redeemedCount: number
  remainingCount: number
  derivedStatus: VoucherBatchStatus
}
