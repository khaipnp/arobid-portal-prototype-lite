import { NextResponse } from "next/server"
import { createGoLIVEEventWithSession } from "@/lib/tradexpo/db/platform-data"
import type { GoLIVEEvent, StreamSession } from "@/lib/tradexpo/types"

interface Props {
  params: Promise<{ expoId: string }>
}

export async function POST(request: Request, { params }: Props) {
  const { expoId } = await params
  const body = (await request.json()) as {
    event?: GoLIVEEvent
    streamSession?: StreamSession
  }
  if (!body.event || !body.streamSession) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }
  if (body.event.expoId !== expoId) {
    return NextResponse.json({ error: "Mismatched expo." }, { status: 400 })
  }
  await createGoLIVEEventWithSession({
    event: body.event,
    streamSession: body.streamSession
  })
  return NextResponse.json({ ok: true })
}
