import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { updatePartnerEnterpriseMember } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

type Props = { params: Promise<{ memberId: string }> }


export async function PATCH(request: Request, { params }: Props) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("enterprise.manage")
    const { memberId } = await params
    const body = (await request.json()) as {
      enterpriseName?: string
      contactEmail?: string | null
    }
    await updatePartnerEnterpriseMember(userId, {
      memberId,
      enterpriseName: body.enterpriseName ?? "",
      contactEmail: body.contactEmail ?? null
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
