import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { settlePartnerMonthlySettlement } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

type Props = { params: Promise<{ settlementId: string }> }


export async function POST(_request: Request, { params }: Props) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("settlement.manage")
    const { settlementId } = await params
    await settlePartnerMonthlySettlement(userId, settlementId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Settle failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
