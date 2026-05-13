import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, userHasRole } from "@/lib/auth/rbac"
import { getPartnerAssignedExpo } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  listExpoHalls,
  updateExpoWithHalls
} from "@/lib/tradexpo/db/platform-data"
import { validateHallBlocks } from "@/lib/tradexpo/expo-create-validation"

interface Props {
  params: Promise<{ expoId: string }>
}

export async function PUT(request: Request, { params }: Props) {
  await ensurePlatformSchema()
  const { expoId } = await params

  let userId = ""
  try {
    userId = await getCurrentUserIdFromRequest()
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const hasPartnerRole = await userHasRole(userId, "partner")
  if (!hasPartnerRole) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  }

  const assignedExpo = await getPartnerAssignedExpo(userId, expoId)
  if (!assignedExpo) {
    return NextResponse.json({ error: "Expo not found." }, { status: 404 })
  }

  const { expo, assignment } = assignedExpo
  if (!assignment.capabilities.includes("edit_expo_content")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  }

  if (expo.status !== "Draft") {
    return NextResponse.json(
      { error: "Only Draft expos can be edited from Partner Portal." },
      { status: 409 }
    )
  }

  const body = (await request.json()) as {
    name?: string
    description?: string
    thumbnailUrl?: string
    categoryIds?: string[]
    startAt?: string
    endAt?: string
    timezone?: string
  }

  const name = body.name?.trim() ?? ""
  if (!name || name.length > 255) {
    return NextResponse.json(
      { error: "Expo name is required (max 255 characters)." },
      { status: 400 }
    )
  }

  const description = body.description?.trim() ?? ""
  if (!description) {
    return NextResponse.json(
      { error: "Description is required." },
      { status: 400 }
    )
  }

  const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds : []
  if (categoryIds.length === 0) {
    return NextResponse.json(
      { error: "Select at least one category." },
      { status: 400 }
    )
  }

  const startAt = body.startAt?.trim() ?? ""
  const endAt = body.endAt?.trim() ?? ""
  if (!startAt || !endAt) {
    return NextResponse.json(
      { error: "Start and end date/time are required." },
      { status: 400 }
    )
  }

  if (!expo.expoTemplateId || !expo.ownerUserId || !expo.ownerEmail) {
    return NextResponse.json(
      { error: "Expo setup is incomplete. Contact an administrator." },
      { status: 400 }
    )
  }

  const halls = await listExpoHalls(expoId)
  const hallErr = validateHallBlocks(halls)
  if (hallErr) {
    return NextResponse.json({ error: hallErr }, { status: 400 })
  }

  try {
    await updateExpoWithHalls(expoId, {
      name,
      description,
      thumbnailUrl: body.thumbnailUrl?.trim() ?? expo.thumbnailUrl,
      expoTemplateId: expo.expoTemplateId,
      categoryIds,
      startAt,
      endAt,
      timezone: body.timezone?.trim() || expo.timezone || "Asia/Bangkok",
      ownerUserId: expo.ownerUserId,
      ownerEmail: expo.ownerEmail,
      halls
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update expo."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
