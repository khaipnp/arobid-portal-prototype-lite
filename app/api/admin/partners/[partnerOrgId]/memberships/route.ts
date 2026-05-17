import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/rbac"
import { invitePartnerUserForAdmin } from "@/lib/partner/admin"
import type { PartnerMvpRole } from "@/lib/partner/core"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

const partnerRoles: PartnerMvpRole[] = ["partner_owner", "partner_admin", "viewer"]

function isPartnerRole(value: unknown): value is PartnerMvpRole {
  return partnerRoles.includes(value as PartnerMvpRole)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ partnerOrgId: string }> }
) {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const { partnerOrgId } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }
  if (!isPartnerRole(body.role)) {
    return NextResponse.json(
      { error: "Invalid Partner membership payload." },
      { status: 400 }
    )
  }

  const result = await invitePartnerUserForAdmin(partnerOrgId, {
    email: String(body.email ?? ""),
    role: body.role
  })
  return NextResponse.json(result)
}
