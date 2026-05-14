import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, userHasRole } from "@/lib/auth/rbac"
import { createPartnerInviteCampaign } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

async function requirePartnerUser() {
  const userId = await getCurrentUserIdFromRequest()
  const allowed = await userHasRole(userId, "partner")
  if (!allowed) throw new Error("Forbidden.")
  return userId
}

export async function POST(request: Request) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerUser()
    const body = (await request.json()) as {
      name?: string
      inviteCode?: string
      quotaId?: string | null
      status?: "draft" | "active" | "paused" | "ended"
    }
    const result = await createPartnerInviteCampaign(userId, {
      name: body.name ?? "",
      inviteCode: body.inviteCode ?? "",
      quotaId: body.quotaId || null,
      status: body.status ?? "active"
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
