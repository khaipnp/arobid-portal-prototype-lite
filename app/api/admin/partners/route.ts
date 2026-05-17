import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, requireRole } from "@/lib/auth/rbac"
import {
  createPartnerOrganizationForAdmin,
  listPartnerOrganizationsForAdmin
} from "@/lib/partner/admin"
import type { PartnerModel, PartnerType } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

const partnerModels: PartnerModel[] = ["co_host", "turnkey", "tenant"]
const partnerTypes: PartnerType[] = [
  "strategic_partner",
  "expo_partner",
  "distribution_partner",
  "alliance_partner",
  "government_program_partner"
]

function isPartnerModel(value: unknown): value is PartnerModel {
  return partnerModels.includes(value as PartnerModel)
}

function isPartnerType(value: unknown): value is PartnerType {
  return partnerTypes.includes(value as PartnerType)
}

export async function GET() {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const organizations = await listPartnerOrganizationsForAdmin()
  return NextResponse.json({ organizations })
}

export async function POST(request: Request) {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const actorUserId = await getCurrentUserIdFromRequest()
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }
  if (!isPartnerModel(body.model) || !isPartnerType(body.partnerType)) {
    return NextResponse.json(
      { error: "Invalid Partner Organization payload." },
      { status: 400 }
    )
  }

  const result = await createPartnerOrganizationForAdmin(actorUserId, {
    name: String(body.name ?? ""),
    model: body.model,
    partnerType: body.partnerType
  })
  return NextResponse.json(result)
}
