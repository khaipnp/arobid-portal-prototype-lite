import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest } from "@/lib/auth/rbac"
import { requirePartnerApiAction } from "@/lib/partner/access"
import {
  listPartnerMiniSiteVersions,
  savePartnerMiniSiteDraft,
  submitPartnerMiniSiteDraft
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function GET() {
  await ensurePlatformSchema()
  const userId = await requirePartnerApiAction("mini_site.write")
  const versions = await listPartnerMiniSiteVersions(userId)
  return NextResponse.json({ versions })
}

export async function POST(request: Request) {
  await ensurePlatformSchema()
  const userId = await requirePartnerApiAction("mini_site.write")
  const body = await readJson(request)
  if (!body || !body.content || typeof body.content !== "object") {
    return NextResponse.json({ error: "Invalid mini-site payload." }, { status: 400 })
  }
  const result = await savePartnerMiniSiteDraft(
    userId,
    body.content as Record<string, unknown>
  )
  return NextResponse.json(result)
}

export async function PUT(request: Request) {
  await ensurePlatformSchema()
  const userId = await getCurrentUserIdFromRequest()
  await requirePartnerApiAction("mini_site.submit")
  const body = await readJson(request)
  if (!body || typeof body.miniSiteId !== "string") {
    return NextResponse.json({ error: "Invalid mini-site payload." }, { status: 400 })
  }
  await submitPartnerMiniSiteDraft(userId, body.miniSiteId)
  return NextResponse.json({ ok: true })
}
