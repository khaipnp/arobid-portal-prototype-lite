import { NextResponse } from "next/server"
import {
  createLiveComment,
  listLiveCommentsBySession
} from "@/lib/tradexpo/db/platform-data"
import type { LiveComment } from "@/lib/tradexpo/types"

interface Props {
  params: Promise<{ sessionId: string }>
}

export async function GET(_: Request, { params }: Props) {
  const { sessionId } = await params
  const comments = await listLiveCommentsBySession(sessionId)
  return NextResponse.json({ comments })
}

export async function POST(request: Request, { params }: Props) {
  const { sessionId } = await params
  const body = (await request.json()) as { comment?: LiveComment }
  if (!body.comment) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }
  if (body.comment.streamSessionId !== sessionId) {
    return NextResponse.json({ error: "Mismatched session." }, { status: 400 })
  }
  await createLiveComment(body.comment)
  return NextResponse.json({ ok: true })
}
