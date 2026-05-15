import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { createPartnerEnterpriseMember } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function POST(request: Request) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("enterprise.manage")
    const body = (await request.json()) as {
      enterpriseName?: string
      contactEmail?: string
    }
    const result = await createPartnerEnterpriseMember(userId, {
      enterpriseName: body.enterpriseName ?? "",
      contactEmail: body.contactEmail ?? null
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
