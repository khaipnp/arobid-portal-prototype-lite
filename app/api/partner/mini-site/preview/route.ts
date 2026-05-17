import { NextResponse } from "next/server"
import { requirePartnerModule } from "@/lib/partner/access"
import { listPartnerMiniSiteVersions } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function GET(request: Request) {
  await ensurePlatformSchema()
  const { getCurrentUserIdFromRequest } = await import("@/lib/auth/rbac")
  const userId = await getCurrentUserIdFromRequest()
  await requirePartnerModule(userId, "mini_site")
  const url = new URL(request.url)
  const versionId = url.searchParams.get("versionId")
  const versions = await listPartnerMiniSiteVersions(userId)
  const version = versionId
    ? versions.find((item) => item.id === versionId)
    : versions[0]

  return NextResponse.json({ version: version ?? null })
}
