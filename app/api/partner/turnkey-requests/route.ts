import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, userHasRole } from "@/lib/auth/rbac"
import { createPartnerTurnkeyExpoRequest } from "@/lib/partner/db"
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
      title?: string
      industry?: string
      targetStartDate?: string
      expectedEnterprises?: number
      requestedBooths?: number
      notes?: string
    }
    const result = await createPartnerTurnkeyExpoRequest(userId, {
      title: body.title ?? "",
      industry: body.industry ?? "",
      targetStartDate: body.targetStartDate || null,
      expectedEnterprises: Number(body.expectedEnterprises),
      requestedBooths: Number(body.requestedBooths),
      notes: body.notes ?? ""
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
