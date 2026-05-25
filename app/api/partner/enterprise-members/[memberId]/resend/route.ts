import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { resendPartnerEnterpriseInvitation } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

type Props = { params: Promise<{ memberId: string }> }

export async function POST(_request: Request, { params }: Props) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("invite.manage")
    const { memberId } = await params
    const result = await resendPartnerEnterpriseInvitation(userId, memberId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resend failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
