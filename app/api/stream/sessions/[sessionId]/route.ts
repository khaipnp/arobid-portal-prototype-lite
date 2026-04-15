import { NextResponse } from "next/server"
import {
  updateGoLIVEEventStatusBySession,
  updateStreamSessionStatus,
} from "@/lib/tradexpo/db/platform-data"
import type { GoLIVEEventStatus, StreamSessionStatus } from "@/lib/tradexpo/types"

interface Props {
  params: Promise<{ sessionId: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  const { sessionId } = await params
  const body = (await request.json()) as {
    streamStatus?: StreamSessionStatus
    goLiveEventStatus?: GoLIVEEventStatus
    startedAt?: string | null
    endedAt?: string | null
    peakViewerCount?: number | null
    updatedAt?: string
  }
  if (!body.streamStatus || !body.goLiveEventStatus || !body.updatedAt) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }
  await updateStreamSessionStatus({
    streamSessionId: sessionId,
    status: body.streamStatus,
    startedAt: body.startedAt ?? null,
    endedAt: body.endedAt ?? null,
    peakViewerCount: body.peakViewerCount ?? null,
    updatedAt: body.updatedAt,
  })
  await updateGoLIVEEventStatusBySession({
    streamSessionId: sessionId,
    status: body.goLiveEventStatus,
    updatedAt: body.updatedAt,
  })
  return NextResponse.json({ ok: true })
}
