import { NextResponse } from "next/server"
import { updateAdministrationCompany } from "@/lib/administration/company-detail"
import { requireRole } from "@/lib/auth/rbac"

interface Props {
  params: Promise<{ companyId: string }>
}

function getStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

export async function PATCH(request: Request, { params }: Props) {
  await requireRole("sys_admin")
  const { companyId } = await params
  let body: {
    name?: string
    taxId?: string | null
    logoUrl?: string | null
    website?: string | null
    address?: string | null
    isActive?: boolean
    representativeUserId?: string | null
    categoryIds?: unknown
  }

  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    )
  }

  if (typeof body.isActive !== "boolean") {
    return NextResponse.json(
      { error: "Company status is required." },
      { status: 400 }
    )
  }

  try {
    const updated = await updateAdministrationCompany({
      companyId,
      name: body.name ?? "",
      taxId: body.taxId ?? null,
      logoUrl: body.logoUrl ?? null,
      website: body.website ?? null,
      address: body.address ?? null,
      isActive: body.isActive,
      representativeUserId: body.representativeUserId ?? null,
      categoryIds: getStringArray(body.categoryIds)
    })

    return NextResponse.json({ ok: true, company: updated })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update company."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
