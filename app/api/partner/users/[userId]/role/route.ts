import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { updatePartnerMemberRole } from "@/lib/partner/db"
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
      role?: "partner_owner" | "partner_admin" | "viewer"
      reason?: string | null
    }
    await updatePartnerMemberRole(actorUserId, userId, {
      role: body.role ?? "viewer",
      reason: body.reason ?? null
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Role update failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
