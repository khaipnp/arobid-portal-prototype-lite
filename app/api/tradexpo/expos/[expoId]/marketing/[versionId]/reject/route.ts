import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, userHasRole } from "@/lib/auth/rbac"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { rejectExpoMarketingContentVersion } from "@/lib/tradexpo/db/platform-data"

interface Props {
  params: Promise<{ expoId: string; versionId: string }>
}

export async function POST(request: Request, { params }: Props) {
  await ensurePlatformSchema()
  let userId = ""
  try {
    userId = await getCurrentUserIdFromRequest()
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const isAdmin =
    (await userHasRole(userId, "admin")) ||
    (await userHasRole(userId, "sys_admin"))
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as { note?: string }
  const { expoId, versionId } = await params
  try {
    const version = await rejectExpoMarketingContentVersion(
      expoId,
      versionId,
      userId,
      body.note
    )
    return NextResponse.json({ ok: true, version })
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not reject marketing content."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
