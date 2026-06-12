import { NextResponse } from "next/server"
import { createBadge, getBadgeManagementWorkspace } from "@/lib/badges/db"
import type { BadgeDraft } from "@/lib/badges/seed-data"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

function errorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Badge request failed."
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function GET() {
  try {
    await ensurePlatformSchema()
    const workspace = await getBadgeManagementWorkspace()
    return NextResponse.json(workspace)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    await ensurePlatformSchema()
    const body = (await request.json()) as BadgeDraft
    const badge = await createBadge(body)
    return NextResponse.json({ badge }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
