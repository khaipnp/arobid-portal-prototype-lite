import { NextResponse } from "next/server"
import { listStreamSessions } from "@/lib/tradexpo/db/platform-data"

export async function GET() {
  const sessions = await listStreamSessions()
  return NextResponse.json({ sessions })
}
