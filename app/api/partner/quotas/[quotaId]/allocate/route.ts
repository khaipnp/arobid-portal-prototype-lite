import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { allocatePartnerQuota } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

type Props = { params: Promise<{ quotaId: string }> }

export async function POST(request: Request, { params }: Props) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("quota.manage")
    const { quotaId } = await params
    const body = (await request.json()) as {
      enterpriseMemberId?: string
      quantity?: number
    }

    await allocatePartnerQuota(userId, {
      quotaId,
      enterpriseMemberId: body.enterpriseMemberId ?? "",
      quantity: Number(body.quantity)
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Allocate failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
