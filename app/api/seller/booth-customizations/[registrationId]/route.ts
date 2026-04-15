import { NextResponse } from "next/server"
import { upsertBoothCustomization } from "@/lib/tradexpo/db/platform-data"
import type { BoothCustomization } from "@/lib/tradexpo/types"

interface Props {
  params: Promise<{ registrationId: string }>
}

export async function PUT(request: Request, { params }: Props) {
  const { registrationId } = await params
  const body = (await request.json()) as { customization?: BoothCustomization }
  if (!body.customization) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }
  if (body.customization.registrationId !== registrationId) {
    return NextResponse.json(
      { error: "Mismatched registration." },
      { status: 400 },
    )
  }
  await upsertBoothCustomization(body.customization)
  return NextResponse.json({ ok: true })
}
