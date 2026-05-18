import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { updatePartnerMemberStatus } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  await ensurePlatformSchema()
  try {
    const actorUserId = await requirePartnerApiAction("invite.manage")
    const { userId } = await params
    const body = (await request.json()) as {
      action?: "disable" | "remove" | "reactivate"
      reason?: string | null
    }
    await updatePartnerMemberStatus(actorUserId, userId, {
      action: body.action ?? "disable",
      reason: body.reason ?? null
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Status update failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
