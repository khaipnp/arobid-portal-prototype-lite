import { NextResponse } from "next/server"
import { createAuthSession } from "@/lib/auth/session"
import { authenticateByEmailPassword } from "@/lib/auth/service"

function getRedirectPath(roles: string[]) {
  if (roles.includes("admin")) return "/admin"
  if (roles.includes("exhibitor")) return "/partner"
  return "/seller"
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      password?: string
    }
    const email = body.email?.trim() ?? ""
    const password = body.password ?? ""
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      )
    }

    const user = await authenticateByEmailPassword({ email, password })
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      )
    }

    await createAuthSession(user.id)
    return NextResponse.json({
      ok: true,
      redirectPath: getRedirectPath(user.roles),
      user: { id: user.id, name: user.name, email: user.email, roles: user.roles }
    })
  } catch {
    return NextResponse.json({ error: "Failed to sign in." }, { status: 500 })
  }
}
