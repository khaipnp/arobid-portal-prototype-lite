import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/rbac"
import { requirePartnerApiAction } from "@/lib/partner/access"
import {
  createPartnerUserInvitation,
  getPartnerUserManagementWorkspace
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function GET() {
  await ensurePlatformSchema()
  try {
    const userId = await requireRole("partner")
    const workspace = await getPartnerUserManagementWorkspace(userId)
    return NextResponse.json(workspace)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("invite.manage")
    const body = (await request.json()) as {
      email?: string
      role?: "partner_owner" | "partner_admin" | "viewer"
      displayName?: string | null
      message?: string | null
    }
    const result = await createPartnerUserInvitation(userId, {
      email: body.email ?? "",
      role: body.role ?? "viewer",
      displayName: body.displayName ?? null,
      message: body.message ?? null
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invite failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
