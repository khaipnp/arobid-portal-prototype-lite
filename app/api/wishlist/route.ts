import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest } from "@/lib/auth/rbac"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  addWishlistItem,
  listWishlistedTargetIds,
  removeWishlistItem,
  type WishlistTargetType
} from "@/lib/wishlist/db"

const TARGET_TYPES = new Set<WishlistTargetType>(["expo", "product", "seller"])

async function requireUserId() {
  try {
    return await getCurrentUserIdFromRequest()
  } catch {
    return null
  }
}

function parseTargetType(value: string | null | undefined) {
  const targetType = value?.trim() as WishlistTargetType | undefined
  return targetType && TARGET_TYPES.has(targetType) ? targetType : null
}

export async function GET(request: Request) {
  await ensurePlatformSchema()
  const userId = await requireUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const targetType = parseTargetType(url.searchParams.get("targetType"))
  if (!targetType) {
    return NextResponse.json(
      { error: "targetType must be expo, product, or seller" },
      { status: 400 }
    )
  }

  const ids = await listWishlistedTargetIds(userId, targetType)
  return NextResponse.json({ targetType, targetIds: [...ids] })
}

export async function POST(request: Request) {
  await ensurePlatformSchema()
  const userId = await requireUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as {
    targetType?: string
    targetId?: string
  } | null
  const targetType = parseTargetType(payload?.targetType)
  const targetId = payload?.targetId?.trim()
  if (!targetType || !targetId) {
    return NextResponse.json(
      { error: "targetType and targetId are required" },
      { status: 400 }
    )
  }

  const created = await addWishlistItem({ userId, targetType, targetId })
  if (!created) {
    return NextResponse.json(
      { error: "Wishlist target was not found or is already saved" },
      { status: 404 }
    )
  }

  return NextResponse.json({ targetType, targetId, isWishlisted: true })
}

export async function DELETE(request: Request) {
  await ensurePlatformSchema()
  const userId = await requireUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const targetType = parseTargetType(url.searchParams.get("targetType"))
  const targetId = url.searchParams.get("targetId")?.trim()
  if (!targetType || !targetId) {
    return NextResponse.json(
      { error: "targetType and targetId are required" },
      { status: 400 }
    )
  }

  await removeWishlistItem({ userId, targetType, targetId })
  return NextResponse.json({ targetType, targetId, isWishlisted: false })
}
