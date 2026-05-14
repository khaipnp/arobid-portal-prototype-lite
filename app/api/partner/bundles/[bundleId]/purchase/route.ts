import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, userHasRole } from "@/lib/auth/rbac"
import { recordPartnerBundlePurchase } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

type Props = { params: Promise<{ bundleId: string }> }

async function requirePartnerUser() {
  const userId = await getCurrentUserIdFromRequest()
  const allowed = await userHasRole(userId, "partner")
  if (!allowed) throw new Error("Forbidden.")
  return userId
}

export async function POST(_request: Request, { params }: Props) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerUser()
    const { bundleId } = await params
    const result = await recordPartnerBundlePurchase(userId, bundleId)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Purchase failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
