import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, requireRole } from "@/lib/auth/rbac"
import {
  setPartnerCapabilitiesForAdmin,
  setPartnerScopesForAdmin
} from "@/lib/partner/admin"
import type { PartnerCapability, PartnerScopeSummary } from "@/lib/partner/core"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

const partnerCapabilities: PartnerCapability[] = [
  "overview",
  "mini_site",
  "enterprise_association",
  "expo_programs",
  "tradecredit_reporting",
  "analytics_reporting"
]

function isPartnerCapability(value: unknown): value is PartnerCapability {
  return partnerCapabilities.includes(value as PartnerCapability)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function parseScopes(value: unknown): PartnerScopeSummary | null {
  if (value === undefined) {
    return { expoIds: [], programIds: [], companyIds: [] }
  }
  if (!value || typeof value !== "object") return null
  const scope = value as Record<string, unknown>
  if (
    !isStringArray(scope.expoIds) ||
    !isStringArray(scope.programIds) ||
    !isStringArray(scope.companyIds)
  ) {
    return null
  }

  return {
    expoIds: scope.expoIds,
    programIds: scope.programIds,
    companyIds: scope.companyIds
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ partnerOrgId: string }> }
) {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const actorUserId = await getCurrentUserIdFromRequest()
  const { partnerOrgId } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const capabilities = body.capabilities ?? []
  const scopes = parseScopes(body.scopes)
  if (
    !Array.isArray(capabilities) ||
    !capabilities.every(isPartnerCapability) ||
    scopes === null
  ) {
    return NextResponse.json(
      { error: "Invalid Partner capability payload." },
      { status: 400 }
    )
  }

  await setPartnerCapabilitiesForAdmin(actorUserId, partnerOrgId, capabilities)
  await setPartnerScopesForAdmin({
    actorUserId,
    partnerOrgId,
    scopes
  })

  return NextResponse.json({ ok: true })
}
