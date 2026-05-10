import { NextResponse } from "next/server"

export async function POST(request: Request) {
  await request.json().catch(() => null)
  return NextResponse.json(
    {
      error:
        "Bank account management is out of scope for Orders & Transactions. Prototype is VNPay-only."
    },
    { status: 410 }
  )
}
