import { NextResponse } from "next/server"
import { softDeleteLiveComment } from "@/lib/tradexpo/db/platform-data"

interface Props {
  params: Promise<{ commentId: string }>
}

export async function DELETE(request: Request, { params }: Props) {
  const { commentId } = await params
  const body = (await request.json()) as {
    deletedByUserId?: string
    deletedAt?: string
  }
  if (!body.deletedByUserId || !body.deletedAt) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }
  await softDeleteLiveComment({
    liveCommentId: commentId,
    deletedByUserId: body.deletedByUserId,
    deletedAt: body.deletedAt,
  })
  return NextResponse.json({ ok: true })
}
