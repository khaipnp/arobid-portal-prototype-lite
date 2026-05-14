import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, userHasRole } from "@/lib/auth/rbac"
import { updatePartnerMessageThreadStatus } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

type Props = { params: Promise<{ threadId: string }> }

async function requirePartnerUser() {
  const userId = await getCurrentUserIdFromRequest()
  const allowed = await userHasRole(userId, "partner")
  if (!allowed) throw new Error("Forbidden.")
  return userId
}

export async function POST(request: Request, { params }: Props) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerUser()
    const { threadId } = await params
    const body = (await request.json()) as { status?: "open" | "closed" }
    if (body.status !== "open" && body.status !== "closed") {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 })
    }
    await updatePartnerMessageThreadStatus(userId, {
      threadId,
      status: body.status
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
