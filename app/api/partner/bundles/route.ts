import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, userHasRole } from "@/lib/auth/rbac"
import { createPartnerServiceBundle } from "@/lib/partner/db"
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
      description?: string
      partnerServicePrice?: number
      arobidServicePrice?: number
      discountAmount?: number
      partnerSharePercent?: number
    }
    const result = await createPartnerServiceBundle(userId, {
      name: body.name ?? "",
      description: body.description ?? "",
      partnerServicePrice: Number(body.partnerServicePrice),
      arobidServicePrice: Number(body.arobidServicePrice),
      discountAmount: Number(body.discountAmount),
      partnerSharePercent: Number(body.partnerSharePercent)
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
