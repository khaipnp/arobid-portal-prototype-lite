import { NextResponse } from "next/server"
import { publishNotification } from "@/lib/notifications/service"
import type { NotificationEventPayload } from "@/lib/notifications/types"

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    )
  }

  try {
    const result = await publishNotification(
      payload as NotificationEventPayload,
    )
    return NextResponse.json(result, { status: result.deduped ? 200 : 201 })
  } catch (error) {
    if (error instanceof Error) {
      const validationErrorMessages = new Set([
        "missing required notification fields",
        "title must be <= 80 characters",
        "body must be <= 120 characters",
      ])
      if (validationErrorMessages.has(error.message)) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    return NextResponse.json(
      { error: "Failed to publish notification." },
      { status: 500 },
    )
  }
}
