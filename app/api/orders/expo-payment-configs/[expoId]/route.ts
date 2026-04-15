import { NextResponse } from "next/server"
import {
  resetExpoPaymentConfig,
  upsertExpoPaymentConfig,
} from "@/lib/orders/db"

interface Props {
  params: Promise<{ expoId: string }>
}

export async function PUT(request: Request, { params }: Props) {
  const { expoId } = await params
  const body = (await request.json()) as {
    vnpayEnabled?: boolean
    bankTransferEnabled?: boolean
    bankAccountId?: string | null
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

  const config = await upsertExpoPaymentConfig({
    expoId,
    vnpayEnabled: body.vnpayEnabled,
    bankTransferEnabled: body.bankTransferEnabled,
    bankAccountId: body.bankAccountId ?? null,
    updatedBy: "admin@arobid.com",
  })
  return NextResponse.json(config)
}

export async function DELETE(_: Request, { params }: Props) {
  const { expoId } = await params
  await resetExpoPaymentConfig(expoId)
  return NextResponse.json({ ok: true })
}
