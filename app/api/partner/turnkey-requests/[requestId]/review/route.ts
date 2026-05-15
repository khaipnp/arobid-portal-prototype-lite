import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { reviewPartnerTurnkeyExpoRequest } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("turnkey.create")
    const { requestId } = await params
    const body = (await request.json()) as {
      decision?: "approved" | "rejected"
      rejectionReason?: string
    }
    if (body.decision !== "approved" && body.decision !== "rejected") {
      throw new Error("Review decision is required.")
    }
    await reviewPartnerTurnkeyExpoRequest(userId, requestId, {
      decision: body.decision,
      rejectionReason: body.rejectionReason
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
