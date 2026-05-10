import { NextResponse } from "next/server"
import {
  cancelGoLIVEEvent,
  deleteGoLIVEEvent,
  updateGoLIVEEventAndSession
} from "@/lib/tradexpo/db/platform-data"
import type { GoLIVEEvent } from "@/lib/tradexpo/types"

interface Props {
  params: Promise<{ eventId: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  const { eventId } = await params
  const body = (await request.json()) as
    | {
        action: "update"
        event: GoLIVEEvent
        replayEnabled: boolean
      }
    | {
        action: "cancel"
      }
  if (body.action === "cancel") {
    await cancelGoLIVEEvent(eventId)
    return NextResponse.json({ ok: true })
  }
  if (body.action === "update") {
    if (!body.event || body.event.goLiveEventId !== eventId) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
    }
    await updateGoLIVEEventAndSession({
      event: body.event,
      replayEnabled: body.replayEnabled
    })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: "Invalid action." }, { status: 400 })
}

export async function DELETE(_: Request, { params }: Props) {
  const { eventId } = await params
  await deleteGoLIVEEvent(eventId)
  return NextResponse.json({ ok: true })
}
