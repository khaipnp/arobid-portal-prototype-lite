import { sql } from "@/lib/db/neon"
import type {
  BankAccount,
  ExpoPaymentConfig,
  Order,
  PaymentConfig,
  TransactionLogEntry,
} from "@/lib/tradexpo/types"

function toIso(value: string | Date) {
  return new Date(value).toISOString()
}

export async function listBankAccounts(): Promise<BankAccount[]> {
  const rows = (await sql`
    select * from bank_accounts order by is_primary desc, created_at desc
  `) as {
    id: string
    bank_name: string
    bank_bin: string
    account_number: string
    account_holder_name: string
    branch: string | null
    is_primary: boolean
    is_active: boolean
    created_at: string | Date
    updated_at: string | Date
  }[]
  return rows.map((r) => ({
    id: r.id,
    bankName: r.bank_name,
    bankBIN: r.bank_bin,
    accountNumber: r.account_number,
    accountHolderName: r.account_holder_name,
    branch: r.branch ?? undefined,
    isPrimary: r.is_primary,
    isActive: r.is_active,
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at),
  }))
}

export async function getPlatformPaymentConfig(): Promise<PaymentConfig> {
  const rows = (await sql`
    select * from platform_payment_config where id = 'default'
  `) as {
    vnpay_enabled: boolean
    bank_transfer_enabled: boolean
    updated_at: string | Date
    updated_by: string
  }[]
  const r = rows[0]
  if (!r) {
    throw new Error(
      "platform_payment_config missing — run bun run platform:seed",
    )
  }
  return {
    vnpayEnabled: r.vnpay_enabled,
    bankTransferEnabled: r.bank_transfer_enabled,
    updatedAt: toIso(r.updated_at),
    updatedBy: r.updated_by,
  }
}

export async function listExpoPaymentConfigs(): Promise<ExpoPaymentConfig[]> {
  const rows = (await sql`
    select * from expo_payment_configs
  `) as {
    expo_id: string
    is_inherited: boolean
    vnpay_enabled: boolean
    bank_transfer_enabled: boolean
    bank_account_id: string | null
    updated_at: string | Date
    updated_by: string
  }[]
  return rows.map((r) => ({
    expoId: r.expo_id,
    isInherited: r.is_inherited,
    vnpayEnabled: r.vnpay_enabled,
    bankTransferEnabled: r.bank_transfer_enabled,
    bankAccountId: r.bank_account_id,
    updatedAt: toIso(r.updated_at),
    updatedBy: r.updated_by,
  }))
}

export async function listOrders(): Promise<Order[]> {
  const rows = (await sql`
    select * from orders order by created_at desc
  `) as {
    id: string
    customer_id: string
    customer_name: string
    customer_email: string
    customer_company: string
    order_type: Order["orderType"]
    reference_id: string
    expo_name: string
    booth_ref: string
    booth_tier: string
    amount: string | number
    payment_method: Order["paymentMethod"]
    status: Order["status"]
    expires_at: string | Date | null
    created_at: string | Date
    updated_at: string | Date
  }[]
  return rows.map((r) => ({
    id: r.id,
    customerId: r.customer_id,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerCompany: r.customer_company,
    orderType: r.order_type,
    referenceId: r.reference_id,
    expoName: r.expo_name,
    boothRef: r.booth_ref,
    boothTier: r.booth_tier,
    amount: Number(r.amount),
    paymentMethod: r.payment_method,
    status: r.status,
    expiresAt: r.expires_at ? toIso(r.expires_at) : undefined,
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at),
  }))
}

export async function listTransactionLog(): Promise<TransactionLogEntry[]> {
  const rows = (await sql`
    select * from transaction_log order by processed_at asc
  `) as {
    id: string
    order_id: string
    type: TransactionLogEntry["type"]
    status: Order["status"]
    actor: string
    note: string | null
    rejection_reason: string | null
    processed_at: string | Date
  }[]
  return rows.map((r) => ({
    id: r.id,
    orderId: r.order_id,
    type: r.type,
    status: r.status,
    actor: r.actor,
    note: r.note ?? undefined,
    rejectionReason: r.rejection_reason ?? undefined,
    processedAt: toIso(r.processed_at),
  }))
}

export async function listTransactionLogForOrder(
  orderId: string,
): Promise<TransactionLogEntry[]> {
  const rows = (await sql`
    select * from transaction_log
    where order_id = ${orderId}
    order by processed_at asc
  `) as {
    id: string
    order_id: string
    type: TransactionLogEntry["type"]
    status: Order["status"]
    actor: string
    note: string | null
    rejection_reason: string | null
    processed_at: string | Date
  }[]
  return rows.map((r) => ({
    id: r.id,
    orderId: r.order_id,
    type: r.type,
    status: r.status,
    actor: r.actor,
    note: r.note ?? undefined,
    rejectionReason: r.rejection_reason ?? undefined,
    processedAt: toIso(r.processed_at),
  }))
}
