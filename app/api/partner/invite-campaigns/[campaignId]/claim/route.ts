import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { claimPartnerInviteCampaign } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

type Props = { params: Promise<{ campaignId: string }> }


export async function POST(request: Request, { params }: Props) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("invite.manage")
    const { campaignId } = await params
    const body = (await request.json()) as {
      enterpriseMemberId?: string | null
    }
    await claimPartnerInviteCampaign(userId, {
      campaignId,
      enterpriseMemberId: body.enterpriseMemberId || null
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Claim failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
