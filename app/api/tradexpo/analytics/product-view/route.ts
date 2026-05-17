import { NextResponse } from "next/server"
import { getCurrentSessionUserId } from "@/lib/auth/session"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  parseExpoAnalyticsPayload,
  recordExpoProductView
} from "@/lib/tradexpo/analytics"

export async function POST(request: Request) {
  try {
    await ensurePlatformSchema()
    const userId = await getCurrentSessionUserId()
    const payload = parseExpoAnalyticsPayload(await request.json())
    await recordExpoProductView({ ...payload, userId })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tracking failed."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
