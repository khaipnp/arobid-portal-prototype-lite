import type {
  BankAccount,
  ExpoPaymentConfig,
  Order,
  PaymentConfig,
  TransactionLogEntry,
} from "@/lib/tradexpo/types"

const now = new Date()
function iso(daysAgo: number, hoursAgo = 0) {
  return new Date(
    now.getTime() - daysAgo * 86400_000 - hoursAgo * 3600_000,
  ).toISOString()
}

export const mockBankAccounts: BankAccount[] = [
  {
    id: "ba-001",
    bankName: "Vietcombank",
    bankBIN: "970436",
    accountNumber: "1014368568888",
    accountHolderName: "CONG TY TNHH AROBID",
    branch: "Chi nhánh Hà Nội",
    isPrimary: true,
    isActive: true,
    createdAt: iso(60),
    updatedAt: iso(5),
  },
  {
    id: "ba-002",
    bankName: "Techcombank",
    bankBIN: "970407",
    accountNumber: "19037291872019",
    accountHolderName: "CONG TY TNHH AROBID",
    branch: "Chi nhánh TP.HCM",
    isPrimary: false,
    isActive: true,
    createdAt: iso(45),
    updatedAt: iso(45),
  },
  {
    id: "ba-003",
    bankName: "BIDV",
    bankBIN: "970418",
    accountNumber: "31410002638888",
    accountHolderName: "CONG TY TNHH AROBID",
    isPrimary: false,
    isActive: false,
    createdAt: iso(120),
    updatedAt: iso(30),
  },
]

export const mockPaymentConfig: PaymentConfig = {
  vnpayEnabled: true,
  bankTransferEnabled: true,
  updatedAt: iso(5),
  updatedBy: "admin@arobid.com",
}

// Per-expo payment config overrides.
// Expos not listed here are treated as isInherited = true (use platform default).
export const mockExpoPaymentConfigs: ExpoPaymentConfig[] = [
  {
    expoId: "expo-003",
    isInherited: false,
    vnpayEnabled: false,
    bankTransferEnabled: true,
    bankAccountId: "ba-002",
    updatedAt: iso(2),
    updatedBy: "admin@arobid.com",
  },
  {
    expoId: "expo-004",
    isInherited: false,
    vnpayEnabled: true,
    bankTransferEnabled: true,
    bankAccountId: null,
    updatedAt: iso(10),
    updatedBy: "admin@arobid.com",
  },
]

const customers = [
  {
    id: "cus-001",
    name: "Nguyễn Minh Khoa",
    email: "khoa.nguyen@techviet.com",
    company: "TechViet Solutions",
  },
  {
    id: "cus-002",
    name: "Trần Thị Lan",
    email: "lan.tran@greenlife.vn",
    company: "GreenLife JSC",
  },
  {
    id: "cus-003",
    name: "Phạm Đức Hải",
    email: "hai.pham@agitech.io",
    company: "AgiTech",
  },
  {
    id: "cus-004",
    name: "Lê Thị Thu",
    email: "thu.le@vinsmart.vn",
    company: "VinSmart Industries",
  },
  {
    id: "cus-005",
    name: "Hoàng Văn Nam",
    email: "nam.hoang@fpt.com.vn",
    company: "FPT Corporation",
  },
  {
    id: "cus-006",
    name: "Vũ Thị Hoa",
    email: "hoa.vu@masan.com",
    company: "Masan Group",
  },
  {
    id: "cus-007",
    name: "Đặng Quốc Bảo",
    email: "bao.dang@vinamilk.com.vn",
    company: "Vinamilk",
  },
]

const expos = [
  { name: "Vietnam Tech Summit 2026", ref: "B-A01", tier: "Premium" },
  { name: "Vietnam Tech Summit 2026", ref: "B-B03", tier: "Standard" },
  { name: "GreenExpo Hanoi 2026", ref: "B-C02", tier: "Premium" },
  { name: "GreenExpo Hanoi 2026", ref: "B-D05", tier: "Economy" },
  { name: "Digital Innovation Fair 2026", ref: "B-A07", tier: "Premium" },
  { name: "Digital Innovation Fair 2026", ref: "B-B12", tier: "Standard" },
  { name: "HCMC Trade Expo 2026", ref: "B-E03", tier: "Economy" },
]

function orderId(n: number) {
  return `ORD-2026-${String(n).padStart(5, "0")}`
}

function makeOrder(
  n: number,
  cIdx: number,
  eIdx: number,
  method: Order["paymentMethod"],
  status: Order["status"],
  daysAgo: number,
): Order {
  const c = customers[cIdx % customers.length]
  const e = expos[eIdx % expos.length]
  const amounts = [15_000_000, 8_500_000, 25_000_000, 5_000_000, 12_000_000]
  const amount = amounts[(n + eIdx) % amounts.length]
  const createdAt = iso(daysAgo)
  const expiresAt =
    status === "Pending Payment" || status === "Awaiting Confirmation"
      ? new Date(new Date(createdAt).getTime() + 72 * 3600_000).toISOString()
      : undefined
  return {
    id: orderId(n),
    customerId: c.id,
    customerName: c.name,
    customerEmail: c.email,
    customerCompany: c.company,
    orderType: "booth_registration",
    referenceId: `booth-${n}`,
    expoName: e.name,
    boothRef: e.ref,
    boothTier: e.tier,
    amount,
    paymentMethod: method,
    status,
    expiresAt,
    createdAt,
    updatedAt: iso(daysAgo - 0.1),
  }
}

export const mockOrders: Order[] = [
  makeOrder(1, 0, 0, "bank_transfer", "Awaiting Confirmation", 0.1),
  makeOrder(2, 1, 2, "bank_transfer", "Awaiting Confirmation", 0.3),
  makeOrder(3, 2, 4, "bank_transfer", "Awaiting Confirmation", 0.5),
  makeOrder(4, 3, 1, "bank_transfer", "Paid", 1),
  makeOrder(5, 4, 3, "vnpay", "Paid", 2),
  makeOrder(6, 5, 5, "vnpay", "Paid", 2),
  makeOrder(7, 6, 6, "bank_transfer", "Paid", 3),
  makeOrder(8, 0, 2, "vnpay", "Paid", 4),
  makeOrder(9, 1, 0, "bank_transfer", "Pending Payment", 0.8),
  makeOrder(10, 2, 3, "bank_transfer", "Pending Payment", 1.5),
  makeOrder(11, 3, 5, "vnpay", "Failed", 5),
  makeOrder(12, 4, 6, "vnpay", "Cancelled", 6),
  makeOrder(13, 5, 1, "bank_transfer", "Expired", 10),
  makeOrder(14, 6, 4, "bank_transfer", "Rejected", 3),
  makeOrder(15, 0, 3, "vnpay", "Paid", 7),
  makeOrder(16, 1, 5, "bank_transfer", "Paid", 8),
  makeOrder(17, 2, 6, "vnpay", "Paid", 9),
  makeOrder(18, 3, 0, "bank_transfer", "Awaiting Confirmation", 0.2),
  makeOrder(19, 4, 2, "vnpay", "Failed", 12),
  makeOrder(20, 5, 4, "bank_transfer", "Expired", 15),
  makeOrder(21, 6, 1, "vnpay", "Paid", 14),
  makeOrder(22, 0, 3, "bank_transfer", "Paid", 16),
  makeOrder(23, 1, 5, "vnpay", "Cancelled", 18),
  makeOrder(24, 2, 6, "bank_transfer", "Rejected", 5),
  makeOrder(25, 3, 0, "vnpay", "Paid", 20),
]

export const mockTransactionLog: TransactionLogEntry[] = [
  // ORD-2026-00001 — Awaiting Confirmation
  {
    id: "tx-001-1",
    orderId: orderId(1),
    type: "status_change",
    status: "Pending Payment",
    actor: "System",
    note: "Order created",
    processedAt: iso(0.1),
  },
  {
    id: "tx-001-2",
    orderId: orderId(1),
    type: "payment",
    status: "Awaiting Confirmation",
    actor: customers[0].name,
    note: "Customer confirmed bank transfer",
    processedAt: iso(0.08),
  },
  // ORD-2026-00004 — Paid (bank transfer)
  {
    id: "tx-004-1",
    orderId: orderId(4),
    type: "status_change",
    status: "Pending Payment",
    actor: "System",
    note: "Order created",
    processedAt: iso(1),
  },
  {
    id: "tx-004-2",
    orderId: orderId(4),
    type: "payment",
    status: "Awaiting Confirmation",
    actor: customers[3].name,
    note: "Customer confirmed bank transfer",
    processedAt: iso(0.9),
  },
  {
    id: "tx-004-3",
    orderId: orderId(4),
    type: "payment",
    status: "Paid",
    actor: "Admin (admin@arobid.com)",
    note: "Payment confirmed after bank statement verification",
    processedAt: iso(0.8),
  },
  // ORD-2026-00005 — Paid (VNPay)
  {
    id: "tx-005-1",
    orderId: orderId(5),
    type: "status_change",
    status: "Pending Payment",
    actor: "System",
    note: "Order created",
    processedAt: iso(2),
  },
  {
    id: "tx-005-2",
    orderId: orderId(5),
    type: "payment",
    status: "Paid",
    actor: "VNPay Gateway",
    note: "VNPay callback: success — ref VNP2026040500123",
    processedAt: iso(1.9),
  },
  // ORD-2026-00014 — Rejected
  {
    id: "tx-014-1",
    orderId: orderId(14),
    type: "status_change",
    status: "Pending Payment",
    actor: "System",
    note: "Order created",
    processedAt: iso(3),
  },
  {
    id: "tx-014-2",
    orderId: orderId(14),
    type: "payment",
    status: "Awaiting Confirmation",
    actor: customers[6].name,
    note: "Customer confirmed bank transfer",
    processedAt: iso(2.9),
  },
  {
    id: "tx-014-3",
    orderId: orderId(14),
    type: "payment",
    status: "Rejected",
    actor: "Admin (admin@arobid.com)",
    rejectionReason:
      "No matching transfer found in bank statement for this order ID and amount.",
    processedAt: iso(2.5),
  },
  {
    id: "tx-014-4",
    orderId: orderId(14),
    type: "status_change",
    status: "Pending Payment",
    actor: "System",
    note: "Order reverted to Pending Payment — 72h retry window started",
    processedAt: iso(2.5),
  },
]
