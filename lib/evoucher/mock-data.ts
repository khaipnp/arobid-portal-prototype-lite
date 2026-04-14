import type {
  VoucherBatch,
  VoucherCode,
  VoucherPartner,
  VoucherTarget,
} from "./types"

// ─── Partners ────────────────────────────────────────────────────────────────

export const mockVoucherPartners: VoucherPartner[] = [
  { id: "partner-001", name: "TechViet Partners Co." },
  { id: "partner-002", name: "GlobalTrade Vietnam" },
  { id: "partner-003", name: "Asia Commerce Hub" },
  { id: "partner-004", name: "Vietnam B2B Network" },
]

// ─── Targets (services + expos) ───────────────────────────────────────────────

export const mockVoucherTargets: VoucherTarget[] = [
  // Services
  {
    id: "svc-b2b-pro",
    name: "B2B Pro Plan (Annual)",
    type: "service",
  },
  {
    id: "svc-premium-booth",
    name: "Premium Booth Package",
    type: "service",
  },
  {
    id: "svc-brand-spotlight",
    name: "Brand Spotlight Listing",
    type: "service",
  },
  // Expos
  {
    id: "expo-001",
    name: "VietTech Innovation Summit 2025",
    type: "expo",
  },
  {
    id: "expo-002",
    name: "MedWorld Asia Expo",
    type: "expo",
  },
  {
    id: "expo-003",
    name: "Food & Farm Global Fair",
    type: "expo",
  },
  {
    id: "expo-004",
    name: "AutoDrive Expo Southeast Asia",
    type: "expo",
  },
]

// ─── Voucher Batches (mutable for prototype) ─────────────────────────────────

export const mockVoucherBatches: VoucherBatch[] = [
  {
    id: "batch-001",
    codePrefix: "EXPO2025",
    name: "VietTech Summit 2025 — Early Bird",
    applicableTo: "expo",
    targetId: "expo-001",
    targetName: "VietTech Innovation Summit 2025",
    assignedToPartnerId: "partner-001",
    assignedToPartnerName: "TechViet Partners Co.",
    validFrom: "2025-01-01",
    validUntil: "2026-12-31",
    issuedQuantity: 100,
    discountType: "percentage",
    discountValue: 15,
    description: "15% off booth registration for early bird exhibitors at VietTech Summit 2025.",
    isRevoked: false,
    createdAt: "2025-01-01T08:00:00Z",
    updatedAt: "2025-01-01T08:00:00Z",
  },
  {
    id: "batch-002",
    codePrefix: "SVC2025",
    name: "B2B Pro Plan Launch Discount",
    applicableTo: "service",
    targetId: "svc-b2b-pro",
    targetName: "B2B Pro Plan (Annual)",
    assignedToPartnerId: "partner-002",
    assignedToPartnerName: "GlobalTrade Vietnam",
    validFrom: "2025-03-01",
    validUntil: "2026-06-30",
    issuedQuantity: 50,
    discountType: "fixed",
    discountValue: 500000,
    description: "500,000 VND off B2B Pro annual subscription.",
    isRevoked: false,
    createdAt: "2025-03-01T09:00:00Z",
    updatedAt: "2025-03-01T09:00:00Z",
  },
  {
    id: "batch-003",
    codePrefix: "NEWYR25",
    name: "New Year 2025 Promo",
    applicableTo: "expo",
    targetId: "expo-003",
    targetName: "Food & Farm Global Fair",
    assignedToPartnerId: "partner-003",
    assignedToPartnerName: "Asia Commerce Hub",
    validFrom: "2025-01-01",
    validUntil: "2025-02-28",
    issuedQuantity: 200,
    discountType: "percentage",
    discountValue: 10,
    description: "Happy New Year! 10% off participation at Food & Farm Global Fair.",
    isRevoked: false,
    createdAt: "2024-12-20T10:00:00Z",
    updatedAt: "2024-12-20T10:00:00Z",
  },
  {
    id: "batch-004",
    codePrefix: "LAUNCH25",
    name: "AutoDrive Expo — Grand Launch",
    applicableTo: "expo",
    targetId: "expo-004",
    targetName: "AutoDrive Expo Southeast Asia",
    assignedToPartnerId: "partner-001",
    assignedToPartnerName: "TechViet Partners Co.",
    validFrom: "2025-04-01",
    validUntil: "2026-09-30",
    issuedQuantity: 20,
    discountType: "fixed",
    discountValue: 1000000,
    description: "Grand launch exclusive: 1,000,000 VND off AutoDrive Expo booth.",
    isRevoked: false,
    createdAt: "2025-04-01T08:00:00Z",
    updatedAt: "2025-04-01T08:00:00Z",
  },
  {
    id: "batch-005",
    codePrefix: "REVOKE24",
    name: "MedWorld Cancelled Promo",
    applicableTo: "expo",
    targetId: "expo-002",
    targetName: "MedWorld Asia Expo",
    assignedToPartnerId: "partner-004",
    assignedToPartnerName: "Vietnam B2B Network",
    validFrom: "2024-09-01",
    validUntil: "2026-11-30",
    issuedQuantity: 100,
    discountType: "percentage",
    discountValue: 20,
    description: "20% off MedWorld Asia Expo participation.",
    isRevoked: true,
    createdAt: "2024-08-15T11:00:00Z",
    updatedAt: "2024-10-01T15:30:00Z",
  },
  {
    id: "batch-006",
    codePrefix: "TECHXPO",
    name: "Tech Expo Partner Bundle",
    applicableTo: "expo",
    targetId: "expo-001",
    targetName: "VietTech Innovation Summit 2025",
    assignedToPartnerId: "partner-002",
    assignedToPartnerName: "GlobalTrade Vietnam",
    validFrom: "2025-06-01",
    validUntil: "2026-12-31",
    issuedQuantity: 500,
    discountType: "percentage",
    discountValue: 5,
    description: "5% partner bundle discount for VietTech Innovation Summit.",
    isRevoked: false,
    createdAt: "2025-06-01T07:00:00Z",
    updatedAt: "2025-06-01T07:00:00Z",
  },
  {
    id: "batch-007",
    codePrefix: "BRAND25",
    name: "Brand Spotlight Q3 Discount",
    applicableTo: "service",
    targetId: "svc-brand-spotlight",
    targetName: "Brand Spotlight Listing",
    assignedToPartnerId: "partner-003",
    assignedToPartnerName: "Asia Commerce Hub",
    validFrom: "2025-07-01",
    validUntil: "2026-09-30",
    issuedQuantity: 30,
    discountType: "fixed",
    discountValue: 200000,
    description: "200,000 VND discount on Brand Spotlight Listing service.",
    isRevoked: false,
    createdAt: "2025-07-01T08:00:00Z",
    updatedAt: "2025-07-01T08:00:00Z",
  },
]

// ─── Individual Codes ─────────────────────────────────────────────────────────
// Pre-seeded codes for demo purposes.
// batch-001: EXPO2025 — 10 Available, 2 Locked, 3 Redeemed (issued=100, rest virtual)
// batch-002: SVC2025 — 10 Available, 1 Locked, 1 Redeemed
// batch-003: NEWYR25 (Expired) — 10 Available, 0 Locked, 5 Redeemed
// batch-004: LAUNCH25 — all 20 Redeemed → Depleted
// batch-005: REVOKE24 — 10 Available (all become Revoked), 1 Locked, 1 Redeemed
// batch-006: TECHXPO — 10 Available, 0 Locked, 0 Redeemed
// batch-007: BRAND25 — 10 Available

function seed(
  batchId: string,
  prefix: string,
  entries: Array<{ suffix: string; status: VoucherCode["status"]; orderId?: string }>,
): VoucherCode[] {
  return entries.map((e, i) => ({
    id: `${batchId}-code-${i + 1}`,
    batchId,
    code: `${prefix}-${e.suffix}`,
    status: e.status,
    lockedByOrderId: e.orderId,
  }))
}

const batch001Codes = seed("batch-001", "EXPO2025", [
  { suffix: "DEMO01", status: "Available" },
  { suffix: "DEMO02", status: "Available" },
  { suffix: "DEMO03", status: "Available" },
  { suffix: "DEMO04", status: "Available" },
  { suffix: "DEMO05", status: "Available" },
  { suffix: "A1B2C3", status: "Available" },
  { suffix: "D4E5F6", status: "Available" },
  { suffix: "G7H8J9", status: "Available" },
  { suffix: "K2L3M4", status: "Available" },
  { suffix: "N5P6Q7", status: "Available" },
  { suffix: "R8S9T1", status: "Locked", orderId: "order-demo-lock-1" },
  { suffix: "U2V3W4", status: "Locked", orderId: "order-demo-lock-2" },
  { suffix: "X5Y6Z7", status: "Redeemed" },
  { suffix: "A8B9C1", status: "Redeemed" },
  { suffix: "D2E3F4", status: "Redeemed" },
])

const batch002Codes = seed("batch-002", "SVC2025", [
  { suffix: "DEMO01", status: "Available" },
  { suffix: "DEMO02", status: "Available" },
  { suffix: "DEMO03", status: "Available" },
  { suffix: "DEMO04", status: "Available" },
  { suffix: "DEMO05", status: "Available" },
  { suffix: "G1H2J3", status: "Available" },
  { suffix: "K4L5M6", status: "Available" },
  { suffix: "N7P8Q9", status: "Available" },
  { suffix: "R1S2T3", status: "Available" },
  { suffix: "U4V5W6", status: "Available" },
  { suffix: "X7Y8Z9", status: "Locked", orderId: "order-demo-lock-3" },
  { suffix: "A1B2C3", status: "Redeemed" },
])

const batch003Codes = seed("batch-003", "NEWYR25", [
  { suffix: "DEMO01", status: "Available" },
  { suffix: "DEMO02", status: "Available" },
  { suffix: "DEMO03", status: "Available" },
  { suffix: "A1B2C3", status: "Available" },
  { suffix: "D4E5F6", status: "Available" },
  { suffix: "G7H8J9", status: "Available" },
  { suffix: "K2L3M4", status: "Available" },
  { suffix: "N5P6Q7", status: "Available" },
  { suffix: "R8S9T1", status: "Available" },
  { suffix: "U2V3W4", status: "Available" },
  { suffix: "X5Y6Z7", status: "Redeemed" },
  { suffix: "A8B9C1", status: "Redeemed" },
  { suffix: "D2E3F4", status: "Redeemed" },
  { suffix: "G5H6J7", status: "Redeemed" },
  { suffix: "K8L9M1", status: "Redeemed" },
])

// batch-004: Depleted — all 20 Redeemed
const batch004Codes: VoucherCode[] = Array.from({ length: 20 }, (_, i) => ({
  id: `batch-004-code-${i + 1}`,
  batchId: "batch-004",
  code: `LAUNCH25-${String(i + 1).padStart(4, "0")}XX`,
  status: "Redeemed",
}))

// batch-005: Revoked batch
const batch005Codes = seed("batch-005", "REVOKE24", [
  { suffix: "DEMO01", status: "Available" },
  { suffix: "A1B2C3", status: "Available" },
  { suffix: "D4E5F6", status: "Available" },
  { suffix: "G7H8J9", status: "Available" },
  { suffix: "K2L3M4", status: "Available" },
  { suffix: "N5P6Q7", status: "Available" },
  { suffix: "R8S9T1", status: "Available" },
  { suffix: "U2V3W4", status: "Available" },
  { suffix: "X5Y6Z7", status: "Available" },
  { suffix: "A8B9C1", status: "Available" },
  { suffix: "D2E3F4", status: "Locked", orderId: "order-demo-lock-4" },
  { suffix: "G5H6J7", status: "Redeemed" },
])

const batch006Codes = seed("batch-006", "TECHXPO", [
  { suffix: "DEMO01", status: "Available" },
  { suffix: "DEMO02", status: "Available" },
  { suffix: "A1B2C3", status: "Available" },
  { suffix: "D4E5F6", status: "Available" },
  { suffix: "G7H8J9", status: "Available" },
  { suffix: "K2L3M4", status: "Available" },
  { suffix: "N5P6Q7", status: "Available" },
  { suffix: "R8S9T1", status: "Available" },
  { suffix: "U2V3W4", status: "Available" },
  { suffix: "X5Y6Z7", status: "Available" },
])

const batch007Codes = seed("batch-007", "BRAND25", [
  { suffix: "DEMO01", status: "Available" },
  { suffix: "DEMO02", status: "Available" },
  { suffix: "A1B2C3", status: "Available" },
  { suffix: "D4E5F6", status: "Available" },
  { suffix: "G7H8J9", status: "Available" },
  { suffix: "K2L3M4", status: "Available" },
  { suffix: "N5P6Q7", status: "Available" },
  { suffix: "R8S9T1", status: "Available" },
  { suffix: "U2V3W4", status: "Available" },
  { suffix: "X5Y6Z7", status: "Available" },
])

export const mockVoucherCodes: VoucherCode[] = [
  ...batch001Codes,
  ...batch002Codes,
  ...batch003Codes,
  ...batch004Codes,
  ...batch005Codes,
  ...batch006Codes,
  ...batch007Codes,
]
