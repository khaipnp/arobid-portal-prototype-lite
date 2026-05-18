import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { cancelPartnerUserInvitation } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  await ensurePlatformSchema()
  try {
    const actorUserId = await requirePartnerApiAction("invite.manage")
    const { invitationId } = await params
    await cancelPartnerUserInvitation(actorUserId, invitationId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cancel failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
