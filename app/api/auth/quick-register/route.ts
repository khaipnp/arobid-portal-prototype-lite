import { NextResponse } from "next/server"
import { quickRegisterBuyer } from "@/lib/auth/quick-register"

export async function POST(request: Request) {
  try {
    const { fullName, email } = await request.json()

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full Name and Email are required." },
        { status: 400 }
      )
    }

    await quickRegisterBuyer(fullName, email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Quick register error:", error)
    return NextResponse.json(
      { error: "Failed to process quick login." },
      { status: 500 }
    )
  }
}
