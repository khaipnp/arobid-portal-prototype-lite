import { NextResponse } from "next/server"

interface Props {
  params: Promise<{ orderId: string }>
}

export async function POST(request: Request, { params }: Props) {
  const { orderId } = await params
  await request.json().catch(() => null)
  return NextResponse.json(
    {
      error: `Manual payment rejection is not available for order ${orderId}. Orders & Transactions is VNPay-only.`
    },
    { status: 410 }
  )
}
