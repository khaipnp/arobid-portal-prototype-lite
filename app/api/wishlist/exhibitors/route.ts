import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest } from "@/lib/auth/rbac"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  addWishlistExhibitor,
  listWishlistedRegistrationIds,
  removeWishlistExhibitor
} from "@/lib/wishlist/db"

async function requireUserId() {
  try {
    return await getCurrentUserIdFromRequest()
  } catch {
    return null
  }
}

export async function GET() {
  await ensurePlatformSchema()
  const userId = await requireUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ids = await listWishlistedRegistrationIds(userId)
  return NextResponse.json({ registrationIds: [...ids] })
}

export async function POST(request: Request) {
  await ensurePlatformSchema()
  const userId = await requireUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as {
    registrationId?: string
  } | null
  const registrationId = payload?.registrationId?.trim()
  if (!registrationId) {
    return NextResponse.json(
      { error: "registrationId is required" },
      { status: 400 }
    )
  }

  await addWishlistExhibitor({ userId, registrationId })
  return NextResponse.json({ registrationId, isWishlisted: true })
}

export async function DELETE(request: Request) {
  await ensurePlatformSchema()
  const userId = await requireUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const registrationId = url.searchParams.get("registrationId")?.trim()
  if (!registrationId) {
    return NextResponse.json(
      { error: "registrationId is required" },
      { status: 400 }
    )
  }

  await removeWishlistExhibitor({ userId, registrationId })
  return NextResponse.json({ registrationId, isWishlisted: false })
}
