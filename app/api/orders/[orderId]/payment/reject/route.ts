import { NextResponse } from "next/server"
import { updateOrderStatusAndAppendLogs } from "@/lib/orders/db"

interface Props {
  params: Promise<{ orderId: string }>
}

export async function POST(request: Request, { params }: Props) {
  const { orderId } = await params
  const body = (await request.json()) as { rejectionReason?: string }
  const rejectionReason = body.rejectionReason?.trim()
  if (!rejectionReason) {
    return NextResponse.json(
      { error: "Rejection reason is required." },
      { status: 400 },
    )
  }

  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 72 * 3600_000).toISOString()
  await updateOrderStatusAndAppendLogs({
    orderId,
    status: "Pending Payment",
    expiresAt,
    logs: [
      {
        id: `tx-${orderId}-reject-${Date.now()}`,
        type: "payment",
        status: "Rejected",
        actor: "Admin (admin@arobid.com)",
        rejectionReason,
        processedAt: now,
      },
      {
        id: `tx-${orderId}-retry-${Date.now()}`,
        type: "status_change",
        status: "Pending Payment",
        actor: "System",
        note: "Order reverted to Pending — 72h retry window started",
        processedAt: now,
      },
    ],
  })
  return NextResponse.json({ ok: true, updatedAt: now, expiresAt })
}
