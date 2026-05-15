import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { consumePartnerQuota } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

type Props = { params: Promise<{ quotaId: string }> }

export async function POST(request: Request, { params }: Props) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("quota.manage")
    const { quotaId } = await params
    const body = (await request.json()) as {
      quantity?: number
      enterpriseMemberId?: string | null
    }
    await consumePartnerQuota(userId, {
      quotaId,
      quantity: Number(body.quantity),
      enterpriseMemberId: body.enterpriseMemberId || null
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Consume failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
