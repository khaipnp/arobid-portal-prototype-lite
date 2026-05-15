import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { convertPartnerTurnkeyExpoRequest } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("turnkey.create")
    const { requestId } = await params
    const result = await convertPartnerTurnkeyExpoRequest(userId, requestId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Convert failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
