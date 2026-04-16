import { NextResponse } from "next/server"
import { updateOrderStatusAndAppendLogs } from "@/lib/orders/db"

interface Props {
  params: Promise<{ orderId: string }>
}

export async function POST(_: Request, { params }: Props) {
  const { orderId } = await params
  const now = new Date().toISOString()
  await updateOrderStatusAndAppendLogs({
    orderId,
    status: "Paid",
    logs: [
      {
        id: `tx-${orderId}-confirm-${Date.now()}`,
        type: "payment",
        status: "Paid",
        actor: "Admin (admin@arobid.com)",
        note: "Payment confirmed after bank statement verification",
        processedAt: now,
      },
    ],
  })

  return NextResponse.json({ ok: true, updatedAt: now })
}
