import { NextResponse } from "next/server"
import { archiveBadge, updateBadge } from "@/lib/badges/db"
import type { BadgeDraft } from "@/lib/badges/seed-data"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

function errorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Badge request failed."
  const status = message === "Badge not found." ? 404 : 400
  return NextResponse.json({ error: message }, { status })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ badgeId: string }> }
) {
  try {
    await ensurePlatformSchema()
    const { badgeId } = await params
    const body = (await request.json()) as BadgeDraft
    const badge = await updateBadge(decodeURIComponent(badgeId), body)
    return NextResponse.json({ badge })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ badgeId: string }> }
) {
  try {
    await ensurePlatformSchema()
    const { badgeId } = await params
    await archiveBadge(decodeURIComponent(badgeId))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
