import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, userHasRole } from "@/lib/auth/rbac"
import {
  createPackageDefinition,
  getPackageDefinitionWorkspace,
  type PackageDefinitionInput
} from "@/lib/plan-subscriptions/db"

async function requireAdminUser() {
  const userId = await getCurrentUserIdFromRequest()
  const allowed =
    (await userHasRole(userId, "sys_admin")) ||
    (await userHasRole(userId, "admin"))
  if (!allowed) throw new Error("Forbidden.")
  return userId
}

export async function GET() {
  try {
    await requireAdminUser()
    const workspace = await getPackageDefinitionWorkspace()
    return NextResponse.json(workspace)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireAdminUser()
    const body = (await request.json()) as PackageDefinitionInput
    const workspace = await createPackageDefinition(userId, body)
    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
