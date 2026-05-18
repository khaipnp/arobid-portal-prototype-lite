import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest } from "@/lib/auth/rbac"
import { sql } from "@/lib/db/neon"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  processTradeCreditEarnEvent,
  resolveTradeCreditReservation
} from "@/lib/tradecredit/db"
import { CURRENT_USER_ID } from "@/lib/user/current-user"

async function getBookingUserId() {
  try {
    return await getCurrentUserIdFromRequest()
  } catch {
    return CURRENT_USER_ID
  }
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST(request: Request) {
  await ensurePlatformSchema()

  try {
    const userId = await getBookingUserId()
    const body = (await request.json()) as Record<string, unknown>
    const orderId = text(body.orderId)
    const reservationId = text(body.reservationId)
    const outcome = text(body.outcome) || "success"

    if (!orderId) {
      return NextResponse.json({ error: "Missing order ID." }, { status: 400 })
    }

    const orderRows = (await sql`
      select id, reference_id, booth_ref, booth_tier, customer_id, status
      from orders
      where id = ${orderId}
        and customer_id = ${userId}
      limit 1
    `) as {
      id: string
      reference_id: string
      booth_ref: string | null
      booth_tier: string | null
      customer_id: string
      status: string
    }[]
    const order = orderRows[0]
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 })
    }

    const isSuccess = outcome === "success"
    const nextStatus = isSuccess ? "Paid" : "Cancelled"
    await sql`
      update orders
      set
        status = ${nextStatus},
        paid_at = case when ${isSuccess} then now() else paid_at end,
        updated_at = now()
      where id = ${orderId}
        and customer_id = ${userId}
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
        ${`tx-${orderId}-${isSuccess ? "paid" : "cancelled"}`},
        ${orderId},
        'payment',
        ${nextStatus},
        'VNPay',
        ${isSuccess ? "VNPay payment confirmed" : "VNPay payment cancelled"},
        null,
        now()
      )
      on conflict (id) do nothing
    `

    if (reservationId) {
      await resolveTradeCreditReservation({
        reservationId,
        outcome: isSuccess ? "burned" : "released"
      })
    }

    if (isSuccess) {
      await sql`
        insert into seller_booth_registrations (
          id,
          user_id,
          expo_id,
          slot_id,
          booth_template_id,
          booth_ref,
          booth_tier,
          status,
          purchased_at
        )
        values (
          ${`reg-${orderId}`},
          ${userId},
          ${order.reference_id},
          null,
          null,
          ${order.booth_ref ?? "TBD"},
          ${order.booth_tier ?? "Standard"},
          'Live',
          now()
        )
        on conflict (id) do nothing
      `
      await processTradeCreditEarnEvent({
        userId,
        sourceModule: "tradexpo",
        eventType: "booth_booking_paid",
        referenceId: orderId,
        occurredAt: new Date().toISOString()
      })
    }

    return NextResponse.json({
      orderId,
      status: nextStatus,
      reservationStatus: reservationId
        ? isSuccess
          ? "burned"
          : "released"
        : null
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to resolve booking."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
