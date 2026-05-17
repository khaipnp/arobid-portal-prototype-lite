import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, requireRole } from "@/lib/auth/rbac"
import { decidePartnerMiniSiteForAdmin } from "@/lib/partner/admin"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

function isReviewDecision(value: unknown): value is "published" | "rejected" {
  return value === "published" || value === "rejected"
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ partnerOrgId: string }> }
) {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const actorUserId = await getCurrentUserIdFromRequest()
  const { partnerOrgId } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const reason = typeof body.reason === "string" ? body.reason.trim() : ""
  if (
    typeof body.miniSiteId !== "string" ||
    body.miniSiteId.trim().length === 0 ||
    !isReviewDecision(body.decision) ||
    (body.decision === "rejected" && reason.length === 0)
  ) {
    return NextResponse.json(
      { error: "Invalid mini-site review payload." },
      { status: 400 }
    )
  }

  await decidePartnerMiniSiteForAdmin({
    actorUserId,
    partnerOrgId,
    miniSiteId: body.miniSiteId,
    decision: body.decision,
    reason: reason || null
  })

  return NextResponse.json({ ok: true })
}
