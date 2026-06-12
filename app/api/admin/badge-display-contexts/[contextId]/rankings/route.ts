import { NextResponse } from "next/server"
import { updateBadgeDisplayRanking } from "@/lib/badges/db"
import type { BadgeRankingConfig } from "@/lib/badges/seed-data"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ contextId: string }> }
) {
  try {
    await ensurePlatformSchema()
    const { contextId } = await params
    const body = (await request.json()) as { ranking?: BadgeRankingConfig[] }
    const workspace = await updateBadgeDisplayRanking(
      decodeURIComponent(contextId),
      body.ranking ?? []
    )
    return NextResponse.json(workspace)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ranking save failed."
    const status = message === "Display context not found." ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
