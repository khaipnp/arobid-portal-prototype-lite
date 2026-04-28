import { NextResponse } from "next/server"

interface Props {
  params: Promise<{ orderId: string }>
}

export async function POST(_: Request, { params }: Props) {
  const { orderId } = await params
  return NextResponse.json(
    {
      error: `Manual payment confirmation is not available for order ${orderId}. Orders & Transactions is VNPay-only.`,
    },
    { status: 410 },
  )
}
