import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, userHasRole } from "@/lib/auth/rbac"
import {
  createPartnerMessageThread,
  type PartnerMessageContextType
} from "@/lib/partner/db"
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
      contextType?: PartnerMessageContextType
      contextId?: string
    }
    if (
      body.contextType !== "service_inquiry" &&
      body.contextType !== "bundle_purchase" &&
      body.contextType !== "deal_support" &&
      body.contextType !== "expo_participation"
    ) {
      return NextResponse.json(
        { error: "Invalid context type." },
        { status: 400 }
      )
    }
    const result = await createPartnerMessageThread(userId, {
      contextType: body.contextType,
      contextId: body.contextId ?? ""
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
