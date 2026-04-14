export type VoucherBatchStatus = "Active" | "Expired" | "Depleted" | "Revoked"
export type VoucherScope = "service" | "expo"
export type DiscountType = "percentage" | "fixed"
export type VoucherCodeStatus = "Available" | "Locked" | "Redeemed" | "Revoked"

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
  codePrefix: string
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
