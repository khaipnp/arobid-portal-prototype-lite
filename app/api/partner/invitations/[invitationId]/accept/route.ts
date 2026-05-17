import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest } from "@/lib/auth/rbac"
import { acceptPartnerUserInvitation } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  await ensurePlatformSchema()
  try {
    const userId = await getCurrentUserIdFromRequest()
    const { invitationId } = await params
    await acceptPartnerUserInvitation(userId, invitationId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Accept failed."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
