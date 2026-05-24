import { NextResponse } from "next/server"

import { getCurrentSessionUserId } from "@/lib/auth/session"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  countExpoDetailProducts,
  listExpoDetailProducts
} from "@/lib/tradexpo/db/platform-data"

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 48

function parseNonNegativeInteger(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(0, Math.floor(parsed))
}

function parseLimit(value: string | null) {
  const parsed = parseNonNegativeInteger(value, DEFAULT_LIMIT)
  return Math.max(1, Math.min(MAX_LIMIT, parsed))
}

export async function GET(request: Request) {
  await ensurePlatformSchema()
  const url = new URL(request.url)
  const expoId = url.searchParams.get("expoId")?.trim()

  if (!expoId) {
    return NextResponse.json({ error: "expoId is required" }, { status: 400 })
  }

  const offset = parseNonNegativeInteger(url.searchParams.get("offset"), 0)
  const limit = parseLimit(url.searchParams.get("limit"))
  const userId = await getCurrentSessionUserId()
  const [total, data] = await Promise.all([
    countExpoDetailProducts(expoId),
    listExpoDetailProducts(expoId, { userId, limit, offset })
  ])

  return NextResponse.json({
    data,
    total,
    hasMore: offset + data.length < total
  })
}
