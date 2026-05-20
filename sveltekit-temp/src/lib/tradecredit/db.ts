import { randomUUID } from "node:crypto"
import { sql } from "$lib/db/neon"
import { publishNotification } from "$lib/notifications/service"
import { listPartnerAssignedExpos } from "$lib/partner/db"
import { CURRENT_USER_ID } from "$lib/user/current-user"
import {
  calculateEarnAward,
  calculateTradeCreditBurn,
  DEFAULT_CREDIT_VALUE_VND,
  MONTHLY_EARN_CAP
} from "./calculations"
import type {
  CreditAccount,
  CreditAccountStatus,
  CreditCapType,
  CreditLedgerEntry,
  CreditLedgerEntryType,
  CreditReservation,
  CreditReservationStatus,
  CreditRule,
  CreditRuleType,
  CreditValuation,
  PartnerTradeCreditReport,
  TradeCreditWallet
} from "./types"

type SqlClient = typeof sql

function toIso(value: string | Date) {
  return new Date(value).toISOString()
}

function toNumber(value: unknown): number {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0

  return Number.isFinite(numberValue) ? numberValue : 0
}

function toInt(value: unknown): number {
  return Math.max(0, Math.floor(toNumber(value)))
}

function mapAccount(row: {
  account_id: string
  owner_user_id: string
  available_balance: number | string
  reserved_balance: number | string
  burned_lifetime: number | string
  expired_lifetime: number | string
  status: CreditAccountStatus
  created_at: string | Date
  updated_at: string | Date
}): CreditAccount {
  return {
    accountId: row.account_id,
    ownerUserId: row.owner_user_id,
    availableBalance: toInt(row.available_balance),
    reservedBalance: toInt(row.reserved_balance),
    burnedLifetime: toInt(row.burned_lifetime),
    expiredLifetime: toInt(row.expired_lifetime),
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }
}

function mapLedger(row: {
  ledger_entry_id: string
  account_id: string
  type: CreditLedgerEntryType
  credit_amount: number | string
  balance_after: number | string
  source_module: string
  source_event_type: string
  reference_id: string
  reason_code: string
  rule_id: string | null
  expires_at: string | Date | null
  created_at: string | Date
}): CreditLedgerEntry {
  return {
    ledgerEntryId: row.ledger_entry_id,
    accountId: row.account_id,
    type: row.type,
    creditAmount: toInt(row.credit_amount),
    balanceAfter: toInt(row.balance_after),
    sourceModule: row.source_module,
    sourceEventType: row.source_event_type,
    referenceId: row.reference_id,
    reasonCode: row.reason_code,
    ...(row.rule_id ? { ruleId: row.rule_id } : {}),
    expiresAt: row.expires_at ? toIso(row.expires_at) : null,
    createdAt: toIso(row.created_at)
  }
}

function mapRule(row: {
  rule_id: string
  rule_type: CreditRuleType
  name: string
  source_module: string
  trigger_event_type: string
  is_enabled: boolean
  credit_quantity: number | string
  cap_type: CreditCapType
  cap_value: number | string | null
  created_at: string | Date
  updated_at: string | Date
}): CreditRule {
  return {
    ruleId: row.rule_id,
    ruleType: row.rule_type,
    name: row.name,
    sourceModule: row.source_module,
    triggerEventType: row.trigger_event_type,
    isEnabled: row.is_enabled,
    creditQuantity: toInt(row.credit_quantity),
    capType: row.cap_type,
    capValue: row.cap_value === null ? null : toInt(row.cap_value),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }
}

function mapValuation(row: {
  valuation_id: string
  credit_value_vnd: number | string
  effective_at: string | Date
  previous_value_vnd: number | string | null
  admin_actor_id: string
  reason_note: string
  created_at: string | Date
}): CreditValuation {
  return {
    valuationId: row.valuation_id,
    creditValueVnd: toInt(row.credit_value_vnd),
    effectiveAt: toIso(row.effective_at),
    previousValueVnd:
      row.previous_value_vnd === null ? null : toInt(row.previous_value_vnd),
    adminActorId: row.admin_actor_id,
    reasonNote: row.reason_note,
    createdAt: toIso(row.created_at)
  }
}

function mapReservation(row: {
  reservation_id: string
  account_id: string
  order_id: string
  credit_amount: number | string
  valuation_id: string
  discount_amount_vnd: number | string
  eligible_amount_vnd: number | string
  status: CreditReservationStatus
  source_module: string
  source_event_type: string
  reference_id: string
  reason_code: string
  scope_type: CreditReservation["scopeType"]
  scope_id: string
  created_at: string | Date
  resolved_at: string | Date | null
}): CreditReservation {
  return {
    reservationId: row.reservation_id,
    accountId: row.account_id,
    orderId: row.order_id,
    creditAmount: toInt(row.credit_amount),
    valuationId: row.valuation_id,
    discountAmountVnd: toInt(row.discount_amount_vnd),
    eligibleAmountVnd: toInt(row.eligible_amount_vnd),
    status: row.status,
    sourceModule: row.source_module,
    sourceEventType: row.source_event_type,
    referenceId: row.reference_id,
    reasonCode: row.reason_code,
    scopeType: row.scope_type,
    scopeId: row.scope_id,
    createdAt: toIso(row.created_at),
    resolvedAt: row.resolved_at ? toIso(row.resolved_at) : null
  }
}

export async function ensureTradeCreditSchema(db: SqlClient = sql) {
  await db`
    create table if not exists credit_accounts (
      account_id text primary key,
      owner_user_id text not null references users(id) on delete cascade,
      available_balance int not null default 0,
      reserved_balance int not null default 0,
      burned_lifetime int not null default 0,
      expired_lifetime int not null default 0,
      status text not null default 'active',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (owner_user_id)
    )
  `
  await db`
    create table if not exists credit_rules (
      rule_id text primary key,
      rule_type text not null,
      name text not null,
      source_module text not null,
      trigger_event_type text not null,
      is_enabled boolean not null default true,
      credit_quantity int not null default 0,
      cap_type text not null default 'none',
      cap_value int,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
  await db`
    create table if not exists credit_valuation_history (
      valuation_id text primary key,
      credit_value_vnd int not null,
      effective_at timestamptz not null,
      previous_value_vnd int,
      admin_actor_id text not null references users(id) on delete restrict,
      reason_note text not null,
      created_at timestamptz not null default now()
    )
  `
  await db`
    create table if not exists credit_ledger_entries (
      ledger_entry_id text primary key,
      account_id text not null references credit_accounts(account_id) on delete cascade,
      type text not null,
      credit_amount int not null,
      balance_after int not null,
      source_module text not null,
      source_event_type text not null,
      reference_id text not null,
      reason_code text not null,
      rule_id text references credit_rules(rule_id) on delete set null,
      expires_at timestamptz,
      created_at timestamptz not null default now()
    )
  `
  await db`
    create table if not exists credit_reservations (
      reservation_id text primary key,
      account_id text not null references credit_accounts(account_id) on delete cascade,
      order_id text not null references orders(id) on delete cascade,
      credit_amount int not null,
      valuation_id text not null references credit_valuation_history(valuation_id) on delete restrict,
      discount_amount_vnd int not null,
      eligible_amount_vnd int not null,
      status text not null default 'reserved',
      source_module text not null,
      source_event_type text not null,
      reference_id text not null,
      reason_code text not null,
      scope_type text not null default 'other',
      scope_id text not null,
      created_at timestamptz not null default now(),
      resolved_at timestamptz
    )
  `
  await db`
    create table if not exists credit_policy_audit_entries (
      audit_entry_id text primary key,
      actor_user_id text not null references users(id) on delete restrict,
      target_type text not null,
      target_id text not null,
      field_name text not null,
      old_value text,
      new_value text,
      reason_note text,
      created_at timestamptz not null default now()
    )
  `

  await db`
    alter table orders add column if not exists trade_credit_reservation_id text
  `
  await db`
    alter table orders add column if not exists trade_credit_amount int not null default 0
  `
  await db`
    alter table orders add column if not exists trade_credit_discount_amount numeric not null default 0
  `

  await db`
    create index if not exists idx_credit_ledger_account_created
    on credit_ledger_entries (account_id, created_at desc)
  `
  await db`
    create index if not exists idx_credit_ledger_rule_reference
    on credit_ledger_entries (account_id, rule_id, reference_id)
  `
  await db`
    create index if not exists idx_credit_ledger_expiry
    on credit_ledger_entries (expires_at)
    where type = 'earn' and expires_at is not null
  `
  await db`
    create index if not exists idx_credit_reservations_order
    on credit_reservations (order_id)
  `
  await db`
    create index if not exists idx_credit_reservations_scope
    on credit_reservations (scope_type, scope_id, status, created_at desc)
  `
  await db`
    create index if not exists idx_credit_rules_lookup
    on credit_rules (rule_type, source_module, trigger_event_type)
  `
  await db`
    create index if not exists idx_credit_valuation_effective
    on credit_valuation_history (effective_at desc, created_at desc)
  `

  await db`
    insert into credit_rules (
      rule_id,
      rule_type,
      name,
      source_module,
      trigger_event_type,
      is_enabled,
      credit_quantity,
      cap_type,
      cap_value
    )
    values
      (
        'earn-tradexpo-booth-booking-paid',
        'earn',
        'TradeXpo booth booking paid',
        'tradexpo',
        'booth_booking_paid',
        true,
        150,
        'per_order',
        1
      ),
      (
        'earn-tradexpo-booth-setup-completed',
        'earn',
        'TradeXpo booth setup completed',
        'tradexpo',
        'booth_setup_completed',
        true,
        150,
        'per_order',
        1
      ),
      (
        'burn-tradexpo-booth-checkout-discount',
        'burn',
        'TradeXpo booth checkout discount',
        'tradexpo',
        'booth_checkout_discount',
        true,
        0,
        'per_order',
        1
      )
    on conflict (rule_id) do nothing
  `
  await db`
    insert into credit_valuation_history (
      valuation_id,
      credit_value_vnd,
      effective_at,
      previous_value_vnd,
      admin_actor_id,
      reason_note
    )
    values (
      'tc-valuation-default',
      ${DEFAULT_CREDIT_VALUE_VND},
      '2000-01-01T00:00:00Z',
      null,
      ${CURRENT_USER_ID},
      'Default initial TradeCredit valuation'
    )
    on conflict (valuation_id) do nothing
  `

  await seedDemoTradeCreditWallet(db)
}

async function seedDemoTradeCreditWallet(db: SqlClient) {
  const accountRows = (await db`
    insert into credit_accounts (
      account_id,
      owner_user_id,
      available_balance,
      reserved_balance,
      burned_lifetime,
      expired_lifetime,
      status,
      created_at,
      updated_at
    )
    values (
      ${`tc-account-${CURRENT_USER_ID}`},
      ${CURRENT_USER_ID},
      0,
      0,
      0,
      0,
      'active',
      now(),
      now()
    )
    on conflict (owner_user_id) do update set updated_at = credit_accounts.updated_at
    returning account_id
  `) as { account_id: string }[]
  const accountId = accountRows[0]?.account_id
  if (!accountId) return

  const existingRows = (await db`
    select 1
    from credit_ledger_entries
    where account_id = ${accountId}
      and reason_code = 'demo_initial_grant'
    limit 1
  `) as { "?column?": number }[]
  if (existingRows.length > 0) return

  await db`
    update credit_accounts
    set available_balance = available_balance + 600, updated_at = now()
    where account_id = ${accountId}
  `
  await db`
    insert into credit_ledger_entries (
      ledger_entry_id,
      account_id,
      type,
      credit_amount,
      balance_after,
      source_module,
      source_event_type,
      reference_id,
      reason_code,
      rule_id,
      expires_at,
      created_at
    )
    values (
      ${`tc-ledger-${randomUUID()}`},
      ${accountId},
      'earn',
      600,
      (
        select available_balance
        from credit_accounts
        where account_id = ${accountId}
      ),
      'system',
      'demo_initial_grant',
      'demo-initial-grant',
      'demo_initial_grant',
      null,
      now() + interval '12 months',
      now()
    )
  `
}

export async function getOrCreateCreditAccount(
  ownerUserId: string
): Promise<CreditAccount> {
  const rows = (await sql`
    insert into credit_accounts (
      account_id,
      owner_user_id,
      available_balance,
      reserved_balance,
      burned_lifetime,
      expired_lifetime,
      status,
      created_at,
      updated_at
    )
    values (
      ${`tc-account-${ownerUserId}`},
      ${ownerUserId},
      0,
      0,
      0,
      0,
      'active',
      now(),
      now()
    )
    on conflict (owner_user_id) do update set updated_at = credit_accounts.updated_at
    returning *
  `) as Parameters<typeof mapAccount>[0][]
  return mapAccount(rows[0])
}

export async function listCreditRules(): Promise<CreditRule[]> {
  const rows = (await sql`
    select *
    from credit_rules
    order by rule_type asc, source_module asc, name asc
  `) as Parameters<typeof mapRule>[0][]
  return rows.map(mapRule)
}

export async function getActiveCreditValuation(): Promise<CreditValuation> {
  const rows = (await sql`
    select *
    from credit_valuation_history
    where effective_at <= now()
    order by effective_at desc, created_at desc
    limit 1
  `) as Parameters<typeof mapValuation>[0][]
  if (!rows[0]) {
    throw new Error("TradeCredit valuation is not configured.")
  }
  return mapValuation(rows[0])
}

export async function listCreditValuationHistory(
  limit = 10
): Promise<CreditValuation[]> {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)))
  const rows = (await sql`
    select *
    from credit_valuation_history
    order by effective_at desc, created_at desc
    limit ${safeLimit}
  `) as Parameters<typeof mapValuation>[0][]
  return rows.map(mapValuation)
}

export async function getTradeCreditWallet(
  ownerUserId: string
): Promise<TradeCreditWallet> {
  const account = await getOrCreateCreditAccount(ownerUserId)
  const [activeValuation, ledgerRows, monthlyRows, expiringRows] =
    await Promise.all([
      getActiveCreditValuation(),
      sql`
        select *
        from credit_ledger_entries
        where account_id = ${account.accountId}
        order by created_at desc, ledger_entry_id desc
        limit 100
      `,
      sql`
        select coalesce(sum(credit_amount), 0)::int as monthly_earned
        from credit_ledger_entries
        where account_id = ${account.accountId}
          and type = 'earn'
          and created_at >= date_trunc('month', now())
      `,
      sql`
        select coalesce(sum(credit_amount), 0)::int as expiring_soon
        from credit_ledger_entries
        where account_id = ${account.accountId}
          and type = 'earn'
          and expires_at is not null
          and expires_at > now()
          and expires_at <= now() + interval '30 days'
      `
    ])

  return {
    account,
    activeValuation,
    expiringSoon: toInt(
      (expiringRows as { expiring_soon: number | string }[])[0]?.expiring_soon
    ),
    monthlyEarned: toInt(
      (monthlyRows as { monthly_earned: number | string }[])[0]?.monthly_earned
    ),
    monthlyCap: MONTHLY_EARN_CAP,
    ledger: (ledgerRows as Parameters<typeof mapLedger>[0][]).map(mapLedger)
  }
}

async function findRule(input: {
  ruleType: CreditRuleType
  sourceModule: string
  eventType: string
}): Promise<CreditRule | null> {
  const rows = (await sql`
    select *
    from credit_rules
    where rule_type = ${input.ruleType}
      and source_module = ${input.sourceModule}
      and trigger_event_type = ${input.eventType}
    limit 1
  `) as Parameters<typeof mapRule>[0][]
  return rows[0] ? mapRule(rows[0]) : null
}

export async function processTradeCreditEarnEvent(input: {
  userId: string
  sourceModule: string
  eventType: string
  referenceId: string
  occurredAt: string
}): Promise<{ awarded: boolean; creditAmount: number; reason?: string }> {
  const rule = await findRule({
    ruleType: "earn",
    sourceModule: input.sourceModule,
    eventType: input.eventType
  })
  if (!rule) return { awarded: false, creditAmount: 0, reason: "no_rule" }
  if (!rule.isEnabled) {
    return { awarded: false, creditAmount: 0, reason: "rule_disabled" }
  }

  const account = await getOrCreateCreditAccount(input.userId)

  const duplicateRows = (await sql`
    select 1
    from credit_ledger_entries
    where account_id = ${account.accountId}
      and rule_id = ${rule.ruleId}
      and reference_id = ${input.referenceId}
      and type = 'earn'
    limit 1
  `) as { "?column?": number }[]
  if (duplicateRows.length > 0) {
    return { awarded: false, creditAmount: 0, reason: "cap_reached" }
  }

  const monthlyRows = (await sql`
    select coalesce(sum(credit_amount), 0)::int as monthly_earned
    from credit_ledger_entries
    where account_id = ${account.accountId}
      and type = 'earn'
      and created_at >= date_trunc('month', ${input.occurredAt}::timestamptz)
      and created_at < date_trunc('month', ${input.occurredAt}::timestamptz) + interval '1 month'
  `) as { monthly_earned: number | string }[]
  const award = calculateEarnAward({
    monthlyEarnedCredits: toInt(monthlyRows[0]?.monthly_earned),
    ruleCreditQuantity: rule.creditQuantity
  })
  if (!award.ok) {
    return { awarded: false, creditAmount: 0, reason: award.reason }
  }

  const ledgerEntryId = `tc-ledger-${randomUUID()}`
  await sql`begin`
  try {
    const updatedRows = (await sql`
      update credit_accounts
      set
        available_balance = available_balance + ${award.creditAmount},
        updated_at = now()
      where account_id = ${account.accountId}
        and status = 'active'
      returning available_balance
    `) as { available_balance: number | string }[]
    const balanceAfter = toInt(updatedRows[0]?.available_balance)
    if (updatedRows.length === 0) {
      throw new Error("TradeCredit account is not active.")
    }
    await sql`
      insert into credit_ledger_entries (
        ledger_entry_id,
        account_id,
        type,
        credit_amount,
        balance_after,
        source_module,
        source_event_type,
        reference_id,
        reason_code,
        rule_id,
        expires_at,
        created_at
      )
      values (
        ${ledgerEntryId},
        ${account.accountId},
        'earn',
        ${award.creditAmount},
        ${balanceAfter},
        ${input.sourceModule},
        ${input.eventType},
        ${input.referenceId},
        ${rule.ruleId},
        ${rule.ruleId},
        ${input.occurredAt}::timestamptz + interval '12 months',
        ${input.occurredAt}::timestamptz
      )
    `
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }

  return { awarded: true, creditAmount: award.creditAmount }
}

export async function reserveTradeCreditForOrder(input: {
  userId: string
  orderId: string
  requestedCredits: number
  originalAmountVnd: number
  eVoucherDiscountVnd: number
  sourceModule: string
  sourceEventType: string
  referenceId: string
  reasonCode: string
  scopeType: CreditReservation["scopeType"]
  scopeId: string
}): Promise<{
  reservationId: string
  creditAmount: number
  discountAmountVnd: number
  finalPayableVnd: number
}> {
  const rule = await findRule({
    ruleType: "burn",
    sourceModule: input.sourceModule,
    eventType: input.sourceEventType
  })
  if (!rule?.isEnabled) {
    throw new Error("TradeCredit burn is not enabled for this checkout.")
  }

  const [account, valuation] = await Promise.all([
    getOrCreateCreditAccount(input.userId),
    getActiveCreditValuation()
  ])
  const burn = calculateTradeCreditBurn({
    originalAmountVnd: input.originalAmountVnd,
    eVoucherDiscountVnd: input.eVoucherDiscountVnd,
    requestedCredits: input.requestedCredits,
    availableCredits: account.availableBalance,
    creditValueVnd: valuation.creditValueVnd
  })
  if (!burn.ok) {
    throw new Error(
      burn.reason === "insufficient_credits"
        ? "Not enough TradeCredit balance."
        : "TradeCredit cannot be applied to this checkout."
    )
  }

  const reservationId = `tc-reservation-${randomUUID()}`
  const ledgerEntryId = `tc-ledger-${randomUUID()}`

  await sql`begin`
  try {
    const updatedRows = (await sql`
      update credit_accounts
      set
        available_balance = available_balance - ${burn.creditAmount},
        reserved_balance = reserved_balance + ${burn.creditAmount},
        updated_at = now()
      where account_id = ${account.accountId}
        and available_balance >= ${burn.creditAmount}
        and status = 'active'
      returning available_balance
    `) as { available_balance: number | string }[]
    if (updatedRows.length === 0) {
      throw new Error("Not enough TradeCredit balance.")
    }
    const balanceAfter = toInt(updatedRows[0]?.available_balance)

    await sql`
      insert into credit_reservations (
        reservation_id,
        account_id,
        order_id,
        credit_amount,
        valuation_id,
        discount_amount_vnd,
        eligible_amount_vnd,
        status,
        source_module,
        source_event_type,
        reference_id,
        reason_code,
        scope_type,
        scope_id
      )
      values (
        ${reservationId},
        ${account.accountId},
        ${input.orderId},
        ${burn.creditAmount},
        ${valuation.valuationId},
        ${burn.discountAmountVnd},
        ${burn.eligibleAmountVnd},
        'reserved',
        ${input.sourceModule},
        ${input.sourceEventType},
        ${input.referenceId},
        ${input.reasonCode},
        ${input.scopeType},
        ${input.scopeId}
      )
    `
    await sql`
      insert into credit_ledger_entries (
        ledger_entry_id,
        account_id,
        type,
        credit_amount,
        balance_after,
        source_module,
        source_event_type,
        reference_id,
        reason_code,
        rule_id,
        expires_at
      )
      values (
        ${ledgerEntryId},
        ${account.accountId},
        'reserve',
        ${burn.creditAmount},
        ${balanceAfter},
        ${input.sourceModule},
        ${input.sourceEventType},
        ${reservationId},
        ${input.reasonCode},
        ${rule.ruleId},
        null
      )
    `
    const orderRows = (await sql`
      update orders
      set
        discount_amount = ${input.eVoucherDiscountVnd + burn.discountAmountVnd},
        amount = ${burn.finalPayableVnd},
        trade_credit_reservation_id = ${reservationId},
        trade_credit_amount = ${burn.creditAmount},
        trade_credit_discount_amount = ${burn.discountAmountVnd},
        updated_at = now()
      where id = ${input.orderId}
      returning id
    `) as { id: string }[]
    if (orderRows.length === 0) {
      throw new Error("Order not found.")
    }
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }

  return {
    reservationId,
    creditAmount: burn.creditAmount,
    discountAmountVnd: burn.discountAmountVnd,
    finalPayableVnd: burn.finalPayableVnd
  }
}

export async function resolveTradeCreditReservation(input: {
  reservationId: string
  outcome: "burned" | "released"
}): Promise<{ resolved: boolean; status: CreditReservationStatus }> {
  const rows = (await sql`
    select *
    from credit_reservations
    where reservation_id = ${input.reservationId}
    limit 1
  `) as Parameters<typeof mapReservation>[0][]
  const reservation = rows[0] ? mapReservation(rows[0]) : null
  if (!reservation) {
    throw new Error("TradeCredit reservation not found.")
  }
  if (reservation.status !== "reserved") {
    return { resolved: false, status: reservation.status }
  }

  const ledgerEntryId = `tc-ledger-${randomUUID()}`
  let ownerUserId = ""

  await sql`begin`
  try {
    const accountRows = (await sql`
      select owner_user_id
      from credit_accounts
      where account_id = ${reservation.accountId}
      limit 1
    `) as { owner_user_id: string }[]
    ownerUserId = accountRows[0]?.owner_user_id ?? ""

    const updatedRows =
      input.outcome === "burned"
        ? ((await sql`
            update credit_accounts
            set
              reserved_balance = greatest(reserved_balance - ${reservation.creditAmount}, 0),
              burned_lifetime = burned_lifetime + ${reservation.creditAmount},
              updated_at = now()
            where account_id = ${reservation.accountId}
            returning available_balance
          `) as { available_balance: number | string }[])
        : ((await sql`
            update credit_accounts
            set
              available_balance = available_balance + ${reservation.creditAmount},
              reserved_balance = greatest(reserved_balance - ${reservation.creditAmount}, 0),
              updated_at = now()
            where account_id = ${reservation.accountId}
            returning available_balance
          `) as { available_balance: number | string }[])
    const balanceAfter = toInt(updatedRows[0]?.available_balance)

    await sql`
      update credit_reservations
      set status = ${input.outcome}, resolved_at = now()
      where reservation_id = ${reservation.reservationId}
    `
    await sql`
      insert into credit_ledger_entries (
        ledger_entry_id,
        account_id,
        type,
        credit_amount,
        balance_after,
        source_module,
        source_event_type,
        reference_id,
        reason_code,
        rule_id,
        expires_at
      )
      values (
        ${ledgerEntryId},
        ${reservation.accountId},
        ${input.outcome === "burned" ? "burn" : "release"},
        ${reservation.creditAmount},
        ${balanceAfter},
        ${reservation.sourceModule},
        ${input.outcome === "burned" ? "payment_success" : "payment_released"},
        ${reservation.reservationId},
        ${reservation.reasonCode},
        null,
        null
      )
    `
    await sql`commit`
  } catch (error) {
    await sql`rollback`
    throw error
  }

  if (input.outcome === "burned" && ownerUserId) {
    await publishNotification({
      userId: ownerUserId,
      source: "tradecredit",
      type: "tradecredit_burn_success",
      title: "TradeCredit used successfully",
      body: `You used ${reservation.creditAmount} credits.`,
      deepLinkPath: `/seller/orders/${reservation.orderId}`,
      referenceId: reservation.reservationId,
      referenceType: "TradeCreditReservation"
    })
  }

  return { resolved: true, status: input.outcome }
}

export async function updateCreditRule(input: {
  ruleId: string
  isEnabled: boolean
  creditQuantity: number
  adminActorId: string
}): Promise<CreditRule> {
  const existingRows = (await sql`
    select *
    from credit_rules
    where rule_id = ${input.ruleId}
    limit 1
  `) as Parameters<typeof mapRule>[0][]
  const existing = existingRows[0] ? mapRule(existingRows[0]) : null
  if (!existing) throw new Error("TradeCredit rule not found.")

  const creditQuantity = Math.max(0, Math.floor(input.creditQuantity))
  const rows = (await sql`
    update credit_rules
    set
      is_enabled = ${input.isEnabled},
      credit_quantity = ${creditQuantity},
      updated_at = now()
    where rule_id = ${input.ruleId}
    returning *
  `) as Parameters<typeof mapRule>[0][]

  await sql`
    insert into credit_policy_audit_entries (
      audit_entry_id,
      actor_user_id,
      target_type,
      target_id,
      field_name,
      old_value,
      new_value,
      reason_note
    )
    values
      (
        ${`tc-audit-${randomUUID()}`},
        ${input.adminActorId},
        'rule',
        ${input.ruleId},
        'is_enabled',
        ${String(existing.isEnabled)},
        ${String(input.isEnabled)},
        null
      ),
      (
        ${`tc-audit-${randomUUID()}`},
        ${input.adminActorId},
        'rule',
        ${input.ruleId},
        'credit_quantity',
        ${String(existing.creditQuantity)},
        ${String(creditQuantity)},
        null
      )
  `

  return mapRule(rows[0])
}

export async function createCreditValuation(input: {
  creditValueVnd: number
  effectiveAt: string
  reasonNote: string
  adminActorId: string
}): Promise<CreditValuation> {
  const reasonNote = input.reasonNote.trim()
  if (!reasonNote) {
    throw new Error("Reason note is required.")
  }
  const creditValueVnd = Math.max(1, Math.floor(input.creditValueVnd))
  const previous = await getActiveCreditValuation()
  const valuationId = `tc-valuation-${randomUUID()}`
  const rows = (await sql`
    insert into credit_valuation_history (
      valuation_id,
      credit_value_vnd,
      effective_at,
      previous_value_vnd,
      admin_actor_id,
      reason_note
    )
    values (
      ${valuationId},
      ${creditValueVnd},
      ${input.effectiveAt}::timestamptz,
      ${previous.creditValueVnd},
      ${input.adminActorId},
      ${reasonNote}
    )
    returning *
  `) as Parameters<typeof mapValuation>[0][]

  await sql`
    insert into credit_policy_audit_entries (
      audit_entry_id,
      actor_user_id,
      target_type,
      target_id,
      field_name,
      old_value,
      new_value,
      reason_note
    )
    values (
      ${`tc-audit-${randomUUID()}`},
      ${input.adminActorId},
      'valuation',
      ${valuationId},
      'credit_value_vnd',
      ${String(previous.creditValueVnd)},
      ${String(creditValueVnd)},
      ${reasonNote}
    )
  `

  return mapValuation(rows[0])
}

export async function listPartnerTradeCreditReports(
  userId: string
): Promise<PartnerTradeCreditReport[]> {
  const assignedExpos = await listPartnerAssignedExpos(userId)
  if (assignedExpos.length === 0) return []

  const reports = await Promise.all(
    assignedExpos.map(async ({ expo }) => {
      const rows = (await sql`
        select
          coalesce(sum(cr.credit_amount), 0)::int as total_credits_burned,
          count(cr.reservation_id)::int as burn_events,
          count(distinct cr.order_id) filter (
            where o.order_type = 'booth_registration'
          )::int as booth_bookings_supported,
          coalesce(sum(o.original_amount), 0)::numeric as credit_assisted_gmv
        from credit_reservations cr
        left join orders o on o.id = cr.order_id
        where cr.scope_type = 'expo'
          and cr.scope_id = ${expo.id}
          and cr.status = 'burned'
      `) as {
        total_credits_burned: number | string
        burn_events: number | string
        booth_bookings_supported: number | string
        credit_assisted_gmv: number | string
      }[]
      const row = rows[0]

      return {
        scopeId: expo.id,
        scopeName: expo.name,
        totalCreditsBurned: toInt(row?.total_credits_burned),
        burnEvents: toInt(row?.burn_events),
        boothBookingsSupported: toInt(row?.booth_bookings_supported),
        creditAssistedGmv: toNumber(row?.credit_assisted_gmv)
      }
    })
  )

  return reports
}
