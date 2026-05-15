import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { updatePartnerServiceBundle } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

type Props = { params: Promise<{ bundleId: string }> }

export async function PATCH(request: Request, { params }: Props) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("bundle.manage")
    const { bundleId } = await params
    const body = (await request.json()) as {
      name?: string
      description?: string
      partnerServicePrice?: number
      arobidServicePrice?: number
      discountAmount?: number
      partnerSharePercent?: number
    }
    await updatePartnerServiceBundle(userId, bundleId, {
      name: body.name ?? "",
      description: body.description ?? "",
      partnerServicePrice: Number(body.partnerServicePrice),
      arobidServicePrice: Number(body.arobidServicePrice),
      discountAmount: Number(body.discountAmount),
      partnerSharePercent: Number(body.partnerSharePercent)
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
