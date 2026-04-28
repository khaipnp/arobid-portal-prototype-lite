import { NextResponse } from "next/server"

export async function PATCH(request: Request) {
  await request.json().catch(() => null)
  return NextResponse.json(
    {
      error:
        "Payment method configuration is out of scope for Orders & Transactions. Prototype is VNPay-only.",
    },
    { status: 410 },
  )
}
