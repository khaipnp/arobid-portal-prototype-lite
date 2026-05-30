import { NextResponse } from "next/server"
import {
  getAccountProfile,
  type UpdateAccountProfileInput,
  updateAccountProfile
} from "@/lib/account/profile"
import { getCurrentSessionUserId } from "@/lib/auth/session"

function isNotFoundError(error: unknown) {
  return (
    error instanceof Error && error.message === "Account profile not found."
  )
}

export async function GET() {
  try {
    const userId = await getCurrentSessionUserId({ clearInvalidCookie: true })
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      )
    }

    try {
      const profile = await getAccountProfile(userId)
      if (!profile) {
        return NextResponse.json(
          { error: "Account profile not found." },
          { status: 404 }
        )
      }

      return NextResponse.json({ profile })
    } catch (error) {
      if (isNotFoundError(error)) {
        return NextResponse.json(
          { error: "Account profile not found." },
          { status: 404 }
        )
      }

      throw error
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to load account profile." },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const userId = await getCurrentSessionUserId({ clearInvalidCookie: true })
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    )
  }

  try {
    const input: UpdateAccountProfileInput =
      typeof body === "object" && body !== null
        ? (body as UpdateAccountProfileInput)
        : {}
    const profile = await updateAccountProfile(userId, input)

    return NextResponse.json({ ok: true, profile })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update account profile."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
