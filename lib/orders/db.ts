import { sql } from "@/lib/db/neon"
import type {
  BankAccount,
  BillingInfoSnapshot,
  ExpoPaymentConfig,
  InvoiceStatus,
  InvoiceType,
  Order,
  OrderStatus,
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
    partner_name: string | null
    order_type: Order["orderType"]
    reference_id: string
    expo_name: string
    booth_ref: string
    booth_tier: string
    original_amount: string | number
    discount_amount: string | number
    amount: string | number
    voucher_id: string | null
    payment_method: Order["paymentMethod"]
    status: Order["status"]
    invoice_requested: boolean
    invoice_type: InvoiceType | null
    billing_info_snapshot: BillingInfoSnapshot | null
    invoice_status: InvoiceStatus
    paid_at: string | Date | null
    exported_at: string | Date | null
    exported_by: string | null
    export_batch_id: string | null
    issued_at: string | Date | null
    issued_by: string | null
    sent_at: string | Date | null
    sent_by: string | null
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
    partnerName: r.partner_name ?? undefined,
    orderType: r.order_type,
    referenceId: r.reference_id,
    expoName: r.expo_name,
    boothRef: r.booth_ref,
    boothTier: r.booth_tier,
    originalAmount: Number(r.original_amount),
    discountAmount: Number(r.discount_amount),
    amount: Number(r.amount),
    voucherId: r.voucher_id ?? undefined,
    paymentMethod: r.payment_method,
    status: r.status,
    invoiceRequested: r.invoice_requested,
    invoiceType: r.invoice_type ?? undefined,
    billingInfoSnapshot: r.billing_info_snapshot ?? undefined,
    invoiceStatus: r.invoice_status,
    paidAt: r.paid_at ? toIso(r.paid_at) : undefined,
    exportedAt: r.exported_at ? toIso(r.exported_at) : undefined,
    exportedBy: r.exported_by ?? undefined,
    exportBatchId: r.export_batch_id ?? undefined,
    issuedAt: r.issued_at ? toIso(r.issued_at) : undefined,
    issuedBy: r.issued_by ?? undefined,
    sentAt: r.sent_at ? toIso(r.sent_at) : undefined,
    sentBy: r.sent_by ?? undefined,
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

export async function updatePlatformPaymentConfig(input: {
  vnpayEnabled: boolean
  bankTransferEnabled: boolean
  updatedBy: string
}): Promise<PaymentConfig> {
  const rows = (await sql`
    insert into platform_payment_config (
      id,
      vnpay_enabled,
      bank_transfer_enabled,
      updated_at,
      updated_by
    )
    values (
      'default',
      ${input.vnpayEnabled},
      ${input.bankTransferEnabled},
      now(),
      ${input.updatedBy}
    )
    on conflict (id) do update set
      vnpay_enabled = excluded.vnpay_enabled,
      bank_transfer_enabled = excluded.bank_transfer_enabled,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by
    returning vnpay_enabled, bank_transfer_enabled, updated_at, updated_by
  `) as {
    vnpay_enabled: boolean
    bank_transfer_enabled: boolean
    updated_at: string | Date
    updated_by: string
  }[]
  const r = rows[0]
  return {
    vnpayEnabled: r.vnpay_enabled,
    bankTransferEnabled: r.bank_transfer_enabled,
    updatedAt: toIso(r.updated_at),
    updatedBy: r.updated_by,
  }
}

export async function upsertExpoPaymentConfig(input: {
  expoId: string
  vnpayEnabled: boolean
  bankTransferEnabled: boolean
  bankAccountId: string | null
  updatedBy: string
}): Promise<ExpoPaymentConfig> {
  const rows = (await sql`
    insert into expo_payment_configs (
      expo_id,
      is_inherited,
      vnpay_enabled,
      bank_transfer_enabled,
      bank_account_id,
      updated_at,
      updated_by
    )
    values (
      ${input.expoId},
      false,
      ${input.vnpayEnabled},
      ${input.bankTransferEnabled},
      ${input.bankAccountId},
      now(),
      ${input.updatedBy}
    )
    on conflict (expo_id) do update set
      is_inherited = false,
      vnpay_enabled = excluded.vnpay_enabled,
      bank_transfer_enabled = excluded.bank_transfer_enabled,
      bank_account_id = excluded.bank_account_id,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by
    returning *
  `) as {
    expo_id: string
    is_inherited: boolean
    vnpay_enabled: boolean
    bank_transfer_enabled: boolean
    bank_account_id: string | null
    updated_at: string | Date
    updated_by: string
  }[]
  const r = rows[0]
  return {
    expoId: r.expo_id,
    isInherited: r.is_inherited,
    vnpayEnabled: r.vnpay_enabled,
    bankTransferEnabled: r.bank_transfer_enabled,
    bankAccountId: r.bank_account_id,
    updatedAt: toIso(r.updated_at),
    updatedBy: r.updated_by,
  }
}

export async function resetExpoPaymentConfig(expoId: string): Promise<void> {
  await sql`
    delete from expo_payment_configs where expo_id = ${expoId}
  `
}

export async function createBankAccount(input: {
  id: string
  bankName: string
  bankBIN: string
  accountNumber: string
  accountHolderName: string
  branch?: string
  isPrimary: boolean
}): Promise<void> {
  await sql`begin`
  try {
    if (input.isPrimary) {
      await sql`update bank_accounts set is_primary = false`
    }
    await sql`
      insert into bank_accounts (
        id, bank_name, bank_bin, account_number, account_holder_name, branch,
        is_primary, is_active, created_at, updated_at
      )
      values (
        ${input.id},
        ${input.bankName},
        ${input.bankBIN},
        ${input.accountNumber},
        ${input.accountHolderName},
        ${input.branch ?? null},
        ${input.isPrimary},
        true,
        now(),
        now()
      )
    `
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}

export async function updateBankAccount(
  id: string,
  input: {
    bankName: string
    bankBIN: string
    accountNumber: string
    accountHolderName: string
    branch?: string
    isPrimary: boolean
  },
): Promise<void> {
  await sql`begin`
  try {
    if (input.isPrimary) {
      await sql`update bank_accounts set is_primary = false where id <> ${id}`
    }
    await sql`
      update bank_accounts
      set
        bank_name = ${input.bankName},
        bank_bin = ${input.bankBIN},
        account_number = ${input.accountNumber},
        account_holder_name = ${input.accountHolderName},
        branch = ${input.branch ?? null},
        is_primary = ${input.isPrimary},
        updated_at = now()
      where id = ${id}
    `
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}

export async function setPrimaryBankAccount(id: string): Promise<void> {
  await sql`begin`
  try {
    await sql`update bank_accounts set is_primary = false`
    await sql`
      update bank_accounts
      set is_primary = true, updated_at = now()
      where id = ${id}
    `
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}

export async function setBankAccountActiveState(
  id: string,
  isActive: boolean,
): Promise<void> {
  await sql`
    update bank_accounts
    set is_active = ${isActive}, updated_at = now()
    where id = ${id}
  `
}

export async function deleteBankAccount(id: string): Promise<void> {
  await sql`delete from bank_accounts where id = ${id}`
}

export async function updateOrderStatusAndAppendLogs(input: {
  orderId: string
  status: OrderStatus
  expiresAt?: string
  logs: {
    id: string
    type: TransactionLogEntry["type"]
    status: OrderStatus
    actor: string
    note?: string
    rejectionReason?: string
    processedAt: string
  }[]
}): Promise<void> {
  await sql`begin`
  try {
    await sql`
      update orders
      set
        status = ${input.status},
        expires_at = ${input.expiresAt ?? null},
        updated_at = now()
      where id = ${input.orderId}
    `
    for (const entry of input.logs) {
      await sql`
        insert into transaction_log (
          id,
          order_id,
          type,
          status,
          actor,
          note,
          rejection_reason,
          processed_at
        )
        values (
          ${entry.id},
          ${input.orderId},
          ${entry.type},
          ${entry.status},
          ${entry.actor},
          ${entry.note ?? null},
          ${entry.rejectionReason ?? null},
          ${entry.processedAt}
        )
      `
    }
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}

export async function updateInvoiceProcessing(input: {
  orderId: string
  invoiceStatus: InvoiceStatus
  exportedAt?: string
  exportedBy?: string
  exportBatchId?: string
  issuedAt?: string
  issuedBy?: string
  sentAt?: string
  sentBy?: string
  log: {
    id: string
    actor: string
    note: string
    processedAt: string
  }
}): Promise<void> {
  await sql`begin`
  try {
    await sql`
      update orders
      set
        invoice_status = ${input.invoiceStatus},
        exported_at = coalesce(${input.exportedAt ?? null}, exported_at),
        exported_by = coalesce(${input.exportedBy ?? null}, exported_by),
        export_batch_id = coalesce(${input.exportBatchId ?? null}, export_batch_id),
        issued_at = coalesce(${input.issuedAt ?? null}, issued_at),
        issued_by = coalesce(${input.issuedBy ?? null}, issued_by),
        sent_at = coalesce(${input.sentAt ?? null}, sent_at),
        sent_by = coalesce(${input.sentBy ?? null}, sent_by),
        updated_at = now()
      where id = ${input.orderId}
    `

    await sql`
      insert into transaction_log (
        id,
        order_id,
        type,
        status,
        actor,
        note,
        rejection_reason,
        processed_at
      )
      values (
        ${input.log.id},
        ${input.orderId},
        'status_change',
        (
          select status from orders where id = ${input.orderId}
        ),
        ${input.log.actor},
        ${input.log.note},
        null,
        ${input.log.processedAt}
      )
    `
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }
}
