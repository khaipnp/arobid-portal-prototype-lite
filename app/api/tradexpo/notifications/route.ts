import { NextResponse } from "next/server"
import { markAllNotificationsRead } from "@/lib/tradexpo/db/platform-data"

export async function PATCH() {
  await markAllNotificationsRead()
  return NextResponse.json({ ok: true })
}
