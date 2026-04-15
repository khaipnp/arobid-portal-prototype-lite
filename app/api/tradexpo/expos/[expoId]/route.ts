import { NextResponse } from "next/server"
import { deleteExpo, updateExpoStatus } from "@/lib/tradexpo/db/platform-data"
import type { ExpoStatus } from "@/lib/tradexpo/types"

interface Props {
  params: Promise<{ expoId: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  const { expoId } = await params
  const body = (await request.json()) as { status?: ExpoStatus }
  if (!body.status) {
    return NextResponse.json({ error: "Missing status." }, { status: 400 })
  }
  await updateExpoStatus(expoId, body.status)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: Props) {
  const { expoId } = await params
  await deleteExpo(expoId)
  return NextResponse.json({ ok: true })
}
