import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import {
  type PartnerServiceExecutionStatus,
  updatePartnerServiceExecutionStatus
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ executionId: string }> }
) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("bundle.manage")
    const { executionId } = await params
    const body = (await request.json()) as {
      status?: PartnerServiceExecutionStatus
    }
    if (!body.status) throw new Error("Status is required.")
    await updatePartnerServiceExecutionStatus(userId, executionId, body.status)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
