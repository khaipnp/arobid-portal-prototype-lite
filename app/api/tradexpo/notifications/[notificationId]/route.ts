import { NextResponse } from "next/server"
import {
  deleteNotification,
  markNotificationRead,
} from "@/lib/tradexpo/db/platform-data"

interface Props {
  params: Promise<{ notificationId: string }>
}

export async function PATCH(_: Request, { params }: Props) {
  const { notificationId } = await params
  await markNotificationRead(notificationId)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: Props) {
  const { notificationId } = await params
  await deleteNotification(notificationId)
  return NextResponse.json({ ok: true })
}
