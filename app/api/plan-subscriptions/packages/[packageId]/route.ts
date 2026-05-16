import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, userHasRole } from "@/lib/auth/rbac"
import {
  getPackageDefinitionDetailWorkspace,
  type PackageDefinitionInput,
  updatePackageDefinition
} from "@/lib/plan-subscriptions/db"

async function requireAdminUser() {
  const userId = await getCurrentUserIdFromRequest()
  const allowed =
    (await userHasRole(userId, "sys_admin")) ||
    (await userHasRole(userId, "admin"))
  if (!allowed) throw new Error("Forbidden.")
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    await requireAdminUser()
    const { packageId } = await params
    const workspace = await getPackageDefinitionDetailWorkspace(packageId)
    if (!workspace) {
      return NextResponse.json({ error: "Package not found." }, { status: 404 })
    }
    return NextResponse.json(workspace)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    await requireAdminUser()
    const { packageId } = await params
    const body = (await request.json()) as PackageDefinitionInput
    const workspace = await updatePackageDefinition(packageId, body)
    return NextResponse.json(workspace)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
