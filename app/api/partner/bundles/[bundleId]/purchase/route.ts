import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { recordPartnerBundlePurchase } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

type Props = { params: Promise<{ bundleId: string }> }

export async function POST(_request: Request, { params }: Props) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("bundle.purchase")
    const { bundleId } = await params
    const result = await recordPartnerBundlePurchase(userId, bundleId)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Purchase failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
