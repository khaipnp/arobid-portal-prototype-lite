import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import {
  createPartnerMessageThread,
  type PartnerMessageContextType
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"


export async function POST(request: Request) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("communications.manage")
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
