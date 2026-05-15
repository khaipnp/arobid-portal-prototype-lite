import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, userHasRole } from "@/lib/auth/rbac"
import { setPackageActive } from "@/lib/plan-subscriptions/db"

async function requireAdminUser() {
  const userId = await getCurrentUserIdFromRequest()
  const allowed =
    (await userHasRole(userId, "sys_admin")) ||
    (await userHasRole(userId, "admin"))
  if (!allowed) throw new Error("Forbidden.")
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    await requireAdminUser()
    const { packageId } = await params
    const body = (await request.json()) as { isActive?: boolean }
    const workspace = await setPackageActive(packageId, body.isActive === true)
    return NextResponse.json(workspace)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
