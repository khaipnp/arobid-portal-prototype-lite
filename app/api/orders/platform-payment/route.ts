import { NextResponse } from "next/server"
import {
  getPlatformPaymentConfig,
  updatePlatformPaymentConfig,
} from "@/lib/orders/db"

export async function GET() {
  try {
    const config = await getPlatformPaymentConfig()
    return NextResponse.json(config)
  } catch {
    return NextResponse.json(
      { error: "Unable to load platform payment config." },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as { vnpayEnabled?: boolean }
    if (!payload.vnpayEnabled) {
      return NextResponse.json(
        {
          error:
            "VNPay is the only active payment method and cannot be disabled.",
        },
        { status: 400 },
      )
    }

    const config = await updatePlatformPaymentConfig({
      vnpayEnabled: true,
      bankTransferEnabled: false,
      updatedBy: "admin@arobid.com",
    })

    return NextResponse.json(config)
  } catch {
    return NextResponse.json(
      { error: "Unable to update platform payment config." },
      { status: 500 },
    )
  }
}
