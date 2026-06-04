import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest } from "@/lib/auth/rbac"
import { requirePartnerAction } from "@/lib/partner/access"
import { getPartnerAssignedExpo } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { saveExpoPackageDisplays } from "@/lib/tradexpo/db/expo-package-displays"
import {
  listExpoHalls,
  submitPartnerExpoMarketingContent,
  updateExpoWithHalls
} from "@/lib/tradexpo/db/platform-data"
import { validateHallBlocks } from "@/lib/tradexpo/expo-create-validation"
import { validateExpoMarketingContent } from "@/lib/tradexpo/expo-marketing-content"
import { validateExpoPackageInputs } from "@/lib/tradexpo/expo-package-displays"

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

  try {
    await requirePartnerAction(userId, "expo.edit")
  } catch {
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
    bannerUrl?: string
    categoryIds?: string[]
    marketingContent?: unknown
    packages?: unknown
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

  const marketingResult = validateExpoMarketingContent(body.marketingContent)
  if (!marketingResult.ok) {
    return NextResponse.json({ error: marketingResult.error }, { status: 400 })
  }

  const packageResult =
    body.packages === undefined
      ? null
      : validateExpoPackageInputs(body.packages)
  if (packageResult && !packageResult.ok) {
    return NextResponse.json({ error: packageResult.error }, { status: 400 })
  }

  try {
    await updateExpoWithHalls(expoId, {
      name,
      description,
      thumbnailUrl: body.thumbnailUrl?.trim() ?? expo.thumbnailUrl,
      bannerUrl: body.bannerUrl?.trim() ?? expo.bannerUrl,
      expoTemplateId: expo.expoTemplateId,
      categoryIds,
      schedulePrecision: expo.schedulePrecision,
      startAt: expo.startAt ?? null,
      endAt: expo.endAt ?? null,
      timezone: expo.timezone || "Asia/Bangkok",
      scheduleMonth: expo.scheduleMonth ?? null,
      scheduleYear: expo.scheduleYear ?? null,
      ownerUserId: expo.ownerUserId,
      ownerEmail: expo.ownerEmail,
      tenantPartnerOrgId: expo.tenantPartnerOrgId,
      displayTargetIds: expo.displayTargetIds,
      halls,
      afterWrite: async (savedExpoId) => {
        if (packageResult?.ok) {
          await saveExpoPackageDisplays(
            savedExpoId,
            packageResult.packages,
            userId
          )
        }
      }
    })
    const marketingVersion = await submitPartnerExpoMarketingContent(
      expoId,
      marketingResult.content,
      userId
    )
    return NextResponse.json({ ok: true, marketingVersion })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update expo."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
