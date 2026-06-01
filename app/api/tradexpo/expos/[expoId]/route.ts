import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, userHasRole } from "@/lib/auth/rbac"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  deleteExpo,
  getExpoById,
  listExpoLayoutTemplates,
  publishAdminExpoMarketingContent,
  updateExpoStatus,
  updateExpoWithHalls
} from "@/lib/tradexpo/db/platform-data"
import { validateHallBlocks } from "@/lib/tradexpo/expo-create-validation"
import { validateExpoMarketingContent } from "@/lib/tradexpo/expo-marketing-content"
import { normalizeExpoScheduleInput } from "@/lib/tradexpo/schedule"
import type { ExpoHallDraft, ExpoStatus } from "@/lib/tradexpo/types"

interface Props {
  params: Promise<{ expoId: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  const { expoId } = await params
  const body = (await request.json()) as { status?: ExpoStatus }
  if (!body.status) {
    return NextResponse.json({ error: "Missing status." }, { status: 400 })
  }
  await updateExpoStatus(expoId, body.status)
  return NextResponse.json({ ok: true })
}

export async function PUT(request: Request, { params }: Props) {
  await ensurePlatformSchema()
  const { expoId } = await params

  const existing = await getExpoById(expoId)
  if (!existing) {
    return NextResponse.json({ error: "Expo not found." }, { status: 404 })
  }

  let body: {
    name?: string
    slug?: string
    description?: string
    thumbnailUrl?: string
    expoTemplateId?: string
    categoryIds?: string[]
    schedulePrecision?: string
    startAt?: string
    endAt?: string
    timezone?: string
    scheduleMonth?: number | string | null
    scheduleYear?: number | string | null
    ownerUserId?: string
    ownerEmail?: string
    halls?: ExpoHallDraft[]
    marketingContent?: unknown
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    )
  }

  const name = body.name?.trim() ?? ""
  if (!name || name.length > 255) {
    return NextResponse.json(
      { error: "Expo name is required (max 255 characters)." },
      { status: 400 }
    )
  }

  const slug = body.slug?.trim() ?? ""
  if (slug) {
    let userId = ""
    try {
      userId = await getCurrentUserIdFromRequest()
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isSuper = await userHasRole(userId, "sys_admin")
    if (!isSuper) {
      return NextResponse.json(
        { error: "Only system admins can edit expo slugs." },
        { status: 403 }
      )
    }
  }

  const description = body.description?.trim() ?? ""
  if (!description) {
    return NextResponse.json(
      { error: "Description is required." },
      { status: 400 }
    )
  }

  const expoTemplateId = body.expoTemplateId?.trim() ?? ""
  if (!expoTemplateId) {
    return NextResponse.json(
      { error: "Select an expo template." },
      { status: 400 }
    )
  }

  const templates = await listExpoLayoutTemplates()
  if (!templates.some((t) => t.id === expoTemplateId)) {
    return NextResponse.json(
      { error: "Invalid expo template." },
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

  const scheduleResult = normalizeExpoScheduleInput(body)
  if (!scheduleResult.ok) {
    return NextResponse.json({ error: scheduleResult.error }, { status: 400 })
  }
  const schedule = scheduleResult.schedule
  const ownerUserId = body.ownerUserId?.trim() ?? ""
  const ownerEmail = body.ownerEmail?.trim().toLowerCase() ?? ""
  if (!ownerUserId || !ownerEmail) {
    return NextResponse.json(
      { error: "Search and select an expo owner account by email." },
      { status: 400 }
    )
  }

  const halls = Array.isArray(body.halls) ? body.halls : []
  const hallErr = validateHallBlocks(halls)
  if (hallErr) {
    return NextResponse.json({ error: hallErr }, { status: 400 })
  }

  const marketingResult = validateExpoMarketingContent(body.marketingContent)
  if (!marketingResult.ok) {
    return NextResponse.json({ error: marketingResult.error }, { status: 400 })
  }

  let userId: string | null = null
  try {
    userId = await getCurrentUserIdFromRequest()
  } catch {
    userId = null
  }

  try {
    await updateExpoWithHalls(expoId, {
      name,
      slug: slug || undefined,
      description,
      thumbnailUrl: body.thumbnailUrl?.trim() ?? "",
      expoTemplateId,
      categoryIds,
      schedulePrecision: schedule.schedulePrecision,
      startAt: schedule.startAt,
      endAt: schedule.endAt,
      timezone: schedule.timezone,
      scheduleMonth: schedule.scheduleMonth,
      scheduleYear: schedule.scheduleYear,
      ownerUserId,
      ownerEmail,
      halls
    })
    await publishAdminExpoMarketingContent(
      expoId,
      marketingResult.content,
      userId
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update expo."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_: Request, { params }: Props) {
  const { expoId } = await params
  await deleteExpo(expoId)
  return NextResponse.json({ ok: true })
}
