import { beforeEach, describe, expect, test } from "bun:test"
import { resolve } from "node:path"
import { config } from "dotenv"

config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

const TEST_USER_ID = "33333333-3333-4333-8333-333333333333"
const TEST_ORDER_ID = "test-tc-order-1"

async function cleanupTradeCreditTestData() {
  const { sql } = await import("@/lib/db/neon")

  await sql`delete from notifications where user_id = ${TEST_USER_ID}`
  await sql`delete from credit_reservations where order_id like 'test-tc-%'`
  await sql`
    delete from credit_ledger_entries
    where account_id in (
      select account_id from credit_accounts where owner_user_id = ${TEST_USER_ID}
    )
  `
  await sql`delete from credit_accounts where owner_user_id = ${TEST_USER_ID}`
  await sql`delete from transaction_log where order_id like 'test-tc-%'`
  await sql`delete from orders where id like 'test-tc-%'`
  await sql`delete from users where id = ${TEST_USER_ID}`
}

async function insertTestUserAndOrder(orderId = TEST_ORDER_ID) {
  const { sql } = await import("@/lib/db/neon")

  await sql`
    insert into users (id, name, email, is_active)
    values (${TEST_USER_ID}, 'TradeCredit Test User', 'tradecredit-test@example.com', true)
  `
  await sql`
    insert into orders (
      id,
      customer_id,
      customer_name,
      customer_email,
      customer_company,
      order_type,
      reference_id,
      expo_name,
      booth_ref,
      booth_tier,
      original_amount,
      discount_amount,
      amount,
      payment_method,
      status,
      created_at,
      updated_at
    )
    values (
      ${orderId},
      ${TEST_USER_ID},
      'TradeCredit Test User',
      'tradecredit-test@example.com',
      'Arobid',
      'booth_registration',
      'test-expo',
      'Test Expo',
      'A01',
      'Premium',
      5000000,
      0,
      5000000,
      'vnpay',
      'Pending Payment',
      now(),
      now()
    )
  `
}

describe("TradeCredit service", () => {
  beforeEach(async () => {
    const { ensurePlatformSchema } = await import(
      "@/lib/platform/ensure-schema"
    )
    await ensurePlatformSchema()
    await cleanupTradeCreditTestData()
    await insertTestUserAndOrder()
  })

  test("earns credits from an enabled system rule", async () => {
    const { getTradeCreditWallet, processTradeCreditEarnEvent } = await import(
      "@/lib/tradecredit/db"
    )

    const result = await processTradeCreditEarnEvent({
      userId: TEST_USER_ID,
      sourceModule: "tradexpo",
      eventType: "booth_booking_paid",
      referenceId: "test-tc-earned-order",
      occurredAt: new Date().toISOString()
    })

    expect(result).toEqual({
      awarded: true,
      creditAmount: 150
    })

    const wallet = await getTradeCreditWallet(TEST_USER_ID)
    expect(wallet.account.availableBalance).toBe(150)
    expect(wallet.monthlyEarned).toBe(150)
    expect(wallet.ledger[0]?.type).toBe("earn")
    expect(wallet.ledger[0]?.creditAmount).toBe(150)
    expect(wallet.ledger[0]?.sourceModule).toBe("tradexpo")
    expect(wallet.ledger[0]?.sourceEventType).toBe("booth_booking_paid")
    expect(wallet.ledger[0]?.referenceId).toBe("test-tc-earned-order")
  })

  test("reserves credits for checkout and burns them on payment success", async () => {
    const { sql } = await import("@/lib/db/neon")
    const {
      getTradeCreditWallet,
      processTradeCreditEarnEvent,
      reserveTradeCreditForOrder,
      resolveTradeCreditReservation
    } = await import("@/lib/tradecredit/db")

    await processTradeCreditEarnEvent({
      userId: TEST_USER_ID,
      sourceModule: "tradexpo",
      eventType: "booth_booking_paid",
      referenceId: "test-tc-seed-credit",
      occurredAt: new Date().toISOString()
    })

    const reservation = await reserveTradeCreditForOrder({
      userId: TEST_USER_ID,
      orderId: TEST_ORDER_ID,
      requestedCredits: 100,
      originalAmountVnd: 5_000_000,
      eVoucherDiscountVnd: 0,
      sourceModule: "tradexpo",
      sourceEventType: "booth_checkout_discount",
      referenceId: "test-expo",
      reasonCode: "booth_discount_burn",
      scopeType: "expo",
      scopeId: "test-expo"
    })

    expect(reservation.creditAmount).toBe(100)
    expect(reservation.discountAmountVnd).toBe(250_000)
    expect(reservation.finalPayableVnd).toBe(4_750_000)

    const reservedWallet = await getTradeCreditWallet(TEST_USER_ID)
    expect(reservedWallet.account.availableBalance).toBe(50)
    expect(reservedWallet.account.reservedBalance).toBe(100)

    await resolveTradeCreditReservation({
      reservationId: reservation.reservationId,
      outcome: "burned"
    })

    const burnedWallet = await getTradeCreditWallet(TEST_USER_ID)
    expect(burnedWallet.account.availableBalance).toBe(50)
    expect(burnedWallet.account.reservedBalance).toBe(0)
    expect(burnedWallet.account.burnedLifetime).toBe(100)

    const notificationRows = (await sql`
      select source, type, title, body, deep_link_path, reference_id, reference_type
      from notifications
      where user_id = ${TEST_USER_ID}
    `) as {
      source: string
      type: string
      title: string
      body: string
      deep_link_path: string
      reference_id: string
      reference_type: string
    }[]

    expect(notificationRows).toEqual([
      {
        source: "tradecredit",
        type: "tradecredit_burn_success",
        title: "TradeCredit used successfully",
        body: "You used 100 credits.",
        deep_link_path: `/seller/orders/${TEST_ORDER_ID}`,
        reference_id: reservation.reservationId,
        reference_type: "TradeCreditReservation"
      }
    ])
  })

  test("releases reserved credits when payment is cancelled", async () => {
    const {
      getTradeCreditWallet,
      processTradeCreditEarnEvent,
      reserveTradeCreditForOrder,
      resolveTradeCreditReservation
    } = await import("@/lib/tradecredit/db")

    await processTradeCreditEarnEvent({
      userId: TEST_USER_ID,
      sourceModule: "tradexpo",
      eventType: "booth_booking_paid",
      referenceId: "test-tc-release-seed",
      occurredAt: new Date().toISOString()
    })
    const reservation = await reserveTradeCreditForOrder({
      userId: TEST_USER_ID,
      orderId: TEST_ORDER_ID,
      requestedCredits: 75,
      originalAmountVnd: 5_000_000,
      eVoucherDiscountVnd: 0,
      sourceModule: "tradexpo",
      sourceEventType: "booth_checkout_discount",
      referenceId: "test-expo",
      reasonCode: "booth_discount_burn",
      scopeType: "expo",
      scopeId: "test-expo"
    })

    await resolveTradeCreditReservation({
      reservationId: reservation.reservationId,
      outcome: "released"
    })

    const wallet = await getTradeCreditWallet(TEST_USER_ID)
    expect(wallet.account.availableBalance).toBe(150)
    expect(wallet.account.reservedBalance).toBe(0)
    expect(wallet.ledger[0]?.type).toBe("release")
    expect(wallet.ledger[0]?.creditAmount).toBe(75)
    expect(wallet.ledger[0]?.referenceId).toBe(reservation.reservationId)
  })
})
