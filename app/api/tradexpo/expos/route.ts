import { NextResponse } from "next/server"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  createExpoWithHalls,
  listActiveExpoTenantOptions,
  listExpoLayoutTemplates,
  publishAdminExpoMarketingContent
} from "@/lib/tradexpo/db/platform-data"
import { validateHallBlocks } from "@/lib/tradexpo/expo-create-validation"
import { validateExpoMarketingContent } from "@/lib/tradexpo/expo-marketing-content"
import { normalizeExpoScheduleInput } from "@/lib/tradexpo/schedule"
import { validateExpoTenantConfig } from "@/lib/tradexpo/tenant-display"
import type { ExpoHallDraft } from "@/lib/tradexpo/types"

export async function POST(request: Request) {
  await ensurePlatformSchema()

  const body = (await request.json()) as {
    name?: string
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
    tenantPartnerOrgId?: string | null
    displayTargetIds?: unknown
    halls?: ExpoHallDraft[]
    marketingContent?: unknown
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

  const scheduleResult = normalizeExpoScheduleInput(body, {
    requireFutureStart: true
  })
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

  const tenantOptions = await listActiveExpoTenantOptions()
  const tenantResult = validateExpoTenantConfig(body, tenantOptions)
  if (!tenantResult.ok) {
    return NextResponse.json({ error: tenantResult.error }, { status: 400 })
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

  try {
    const result = await createExpoWithHalls({
      name,
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
      tenantPartnerOrgId: tenantResult.tenantPartnerOrgId,
      displayTargetIds: tenantResult.displayTargetIds,
      halls
    })
    await publishAdminExpoMarketingContent(
      result.id,
      marketingResult.content,
      null
    )
    return NextResponse.json({ id: result.id })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create expo."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
