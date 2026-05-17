import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { acceptPartnerEnterpriseAssociation } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

type Props = { params: Promise<{ memberId: string }> }

export async function POST(_request: Request, { params }: Props) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("enterprise.manage")
    const { memberId } = await params
    await acceptPartnerEnterpriseAssociation(userId, memberId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Accept failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
