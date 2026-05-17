import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/rbac"
import { updatePartnerMembershipForAdmin } from "@/lib/partner/admin"
import type { PartnerMvpRole } from "@/lib/partner/core"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

const partnerRoles: PartnerMvpRole[] = [
  "partner_owner",
  "partner_admin",
  "viewer"
]
const membershipStatuses = ["active", "inactive", "removed"] as const

type MembershipStatus = (typeof membershipStatuses)[number]

function isPartnerRole(value: unknown): value is PartnerMvpRole {
  return partnerRoles.includes(value as PartnerMvpRole)
}

function isMembershipStatus(value: unknown): value is MembershipStatus {
  return membershipStatuses.includes(value as MembershipStatus)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ partnerOrgId: string; userId: string }> }
) {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const { partnerOrgId, userId } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }
  const role = body.role === undefined ? undefined : body.role
  const status = body.status === undefined ? undefined : body.status
  if (
    (role !== undefined && !isPartnerRole(role)) ||
    (status !== undefined && !isMembershipStatus(status))
  ) {
    return NextResponse.json(
      { error: "Invalid Partner membership payload." },
      { status: 400 }
    )
  }

  await updatePartnerMembershipForAdmin({
    partnerOrgId,
    userId,
    role,
    status
  })
  return NextResponse.json({ ok: true })
}
