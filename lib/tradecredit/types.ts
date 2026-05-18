export type CreditAccountStatus = "active" | "suspended"
export type CreditLedgerEntryType =
  | "earn"
  | "reserve"
  | "burn"
  | "release"
  | "expire"
  | "adjust"
  | "reverse"
export type CreditRuleType = "earn" | "burn"
export type CreditCapType =
  | "none"
  | "one_time"
  | "monthly"
  | "per_expo"
  | "per_order"
export type CreditReservationStatus = "reserved" | "burned" | "released"

export type CreditAccount = {
  accountId: string
  ownerUserId: string
  availableBalance: number
  reservedBalance: number
  burnedLifetime: number
  expiredLifetime: number
  status: CreditAccountStatus
  createdAt: string
  updatedAt: string
}

export type CreditLedgerEntry = {
  ledgerEntryId: string
  accountId: string
  type: CreditLedgerEntryType
  creditAmount: number
  balanceAfter: number
  sourceModule: string
  sourceEventType: string
  referenceId: string
  reasonCode: string
  ruleId?: string
  expiresAt: string | null
  createdAt: string
}

export type CreditRule = {
  ruleId: string
  ruleType: CreditRuleType
  name: string
  sourceModule: string
  triggerEventType: string
  isEnabled: boolean
  creditQuantity: number
  capType: CreditCapType
  capValue: number | null
  createdAt: string
  updatedAt: string
}

export type CreditValuation = {
  valuationId: string
  creditValueVnd: number
  effectiveAt: string
  previousValueVnd: number | null
  adminActorId: string
  reasonNote: string
  createdAt: string
}

export type CreditReservation = {
  reservationId: string
  accountId: string
  orderId: string
  creditAmount: number
  valuationId: string
  discountAmountVnd: number
  eligibleAmountVnd: number
  status: CreditReservationStatus
  sourceModule: string
  sourceEventType: string
  referenceId: string
  reasonCode: string
  scopeType: "expo" | "campaign" | "service" | "other"
  scopeId: string
  createdAt: string
  resolvedAt: string | null
}

export type TradeCreditWallet = {
  account: CreditAccount
  activeValuation: CreditValuation
  expiringSoon: number
  monthlyEarned: number
  monthlyCap: number
  ledger: CreditLedgerEntry[]
}

export type PartnerTradeCreditReport = {
  scopeId: string
  scopeName: string
  totalCreditsBurned: number
  burnEvents: number
  boothBookingsSupported: number
  creditAssistedGmv: number
}
