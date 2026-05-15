import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { createPartnerQuota } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function POST(request: Request) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("quota.manage")
    const body = (await request.json()) as {
      quotaType?: string
      label?: string
      totalQuantity?: number
    }
    if (
      body.quotaType !== "booth_credits" &&
      body.quotaType !== "expo_program_quota" &&
      body.quotaType !== "bulk_booth_inventory"
    ) {
      return NextResponse.json(
        { error: "Invalid quota type." },
        { status: 400 }
      )
    }

    const result = await createPartnerQuota(userId, {
      quotaType: body.quotaType,
      label: body.label ?? "",
      totalQuantity: Number(body.totalQuantity)
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
