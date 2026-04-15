import { NextResponse } from "next/server"
import { updatePlatformPaymentConfig } from "@/lib/orders/db"

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    vnpayEnabled?: boolean
    bankTransferEnabled?: boolean
  }
  if (
    typeof body.vnpayEnabled !== "boolean" ||
    typeof body.bankTransferEnabled !== "boolean"
  ) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }
  if (!body.vnpayEnabled && !body.bankTransferEnabled) {
    return NextResponse.json(
      { error: "At least one payment method must be enabled." },
      { status: 400 },
    )
  }

  const paymentConfig = await updatePlatformPaymentConfig({
    vnpayEnabled: body.vnpayEnabled,
    bankTransferEnabled: body.bankTransferEnabled,
    updatedBy: "admin@arobid.com",
  })
  return NextResponse.json(paymentConfig)
}
