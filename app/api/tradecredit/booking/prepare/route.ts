import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest } from "@/lib/auth/rbac"
import { sql } from "@/lib/db/neon"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { reserveTradeCreditForOrder } from "@/lib/tradecredit/db"
import { CURRENT_USER_ID } from "@/lib/user/current-user"

const PAYMENT_EXPIRY_MINUTES = 15

async function getBookingUserId() {
  try {
    return await getCurrentUserIdFromRequest()
  } catch {
    return CURRENT_USER_ID
  }
}

function positiveNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST(request: Request) {
  await ensurePlatformSchema()

  try {
    const userId = await getBookingUserId()
    const body = (await request.json()) as Record<string, unknown>
    const expoId = text(body.expoId)
    const expoName = text(body.expoName)
    const boothRef = text(body.boothRef)
    const boothTier = text(body.boothTier)
    const originalAmountVnd = positiveNumber(body.originalAmountVnd)
    const eVoucherDiscountVnd = positiveNumber(body.eVoucherDiscountVnd)
    const requestedCredits = positiveNumber(body.tradeCreditAmount)

    if (!expoId || !expoName || !boothRef || !boothTier) {
      return NextResponse.json(
        { error: "Missing booking context." },
        { status: 400 }
      )
    }
    if (originalAmountVnd <= 0) {
      return NextResponse.json(
        { error: "Invalid booking amount." },
        { status: 400 }
      )
    }

    const userRows = (await sql`
      select name, email
      from users
      where id = ${userId}
      limit 1
    `) as { name: string; email: string }[]
    const user = userRows[0] ?? {
      name: "Arobid User",
      email: "user@arobid.local"
    }
    const orderId = `tc-booking-${randomUUID()}`
    const initialPayable = Math.max(originalAmountVnd - eVoucherDiscountVnd, 0)
    const expiresAt = new Date(Date.now() + PAYMENT_EXPIRY_MINUTES * 60 * 1000)

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
        invoice_requested,
        invoice_status,
        expires_at,
        created_at,
        updated_at
      )
      values (
        ${orderId},
        ${userId},
        ${user.name},
        ${user.email},
        'Arobid',
        'booth_registration',
        ${expoId},
        ${expoName},
        ${boothRef},
        ${boothTier},
        ${originalAmountVnd},
        ${eVoucherDiscountVnd},
        ${initialPayable},
        'vnpay',
        'Pending Payment',
        false,
        'not_requested',
        ${expiresAt},
        now(),
        now()
      )
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
        ${`tx-${orderId}-created`},
        ${orderId},
        'payment',
        'Pending Payment',
        'Customer',
        'VNPay payment session created',
        null,
        now()
      )
    `

    let reservation: Awaited<
      ReturnType<typeof reserveTradeCreditForOrder>
    > | null = null
    try {
      reservation =
        requestedCredits > 0
          ? await reserveTradeCreditForOrder({
              userId,
              orderId,
              requestedCredits,
              originalAmountVnd,
              eVoucherDiscountVnd,
              sourceModule: "tradexpo",
              sourceEventType: "booth_checkout_discount",
              referenceId: expoId,
              reasonCode: "booth_discount_burn",
              scopeType: "expo",
              scopeId: expoId
            })
          : null
    } catch (error) {
      await sql`
        delete from orders
        where id = ${orderId}
          and customer_id = ${userId}
      `
      throw error
    }

    return NextResponse.json({
      orderId,
      reservationId: reservation?.reservationId ?? null,
      creditAmount: reservation?.creditAmount ?? 0,
      tradeCreditDiscountAmountVnd: reservation?.discountAmountVnd ?? 0,
      finalPayableVnd: reservation?.finalPayableVnd ?? initialPayable,
      expiresAt: expiresAt.toISOString()
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to prepare booking."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
