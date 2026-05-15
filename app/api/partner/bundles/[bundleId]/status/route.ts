import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { updatePartnerServiceBundleStatus } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

type Props = { params: Promise<{ bundleId: string }> }


export async function POST(request: Request, { params }: Props) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("bundle.manage")
    const { bundleId } = await params
    const body = (await request.json()) as {
      status?: "draft" | "published" | "archived"
    }
    if (
      body.status !== "draft" &&
      body.status !== "published" &&
      body.status !== "archived"
    ) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 })
    }
    await updatePartnerServiceBundleStatus(userId, bundleId, body.status)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
