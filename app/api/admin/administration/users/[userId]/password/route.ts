import { NextResponse } from "next/server"
import {
  getRequestAuditContext,
  recordUserAuditEvent,
  resetAdministrationUserPassword
} from "@/lib/administration/user-detail"
import { requireRole } from "@/lib/auth/rbac"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

interface Props {
  params: Promise<{ userId: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  const actorUserId = await requireRole("sys_admin")
  await ensurePlatformSchema()
  const { userId } = await params
  let body: { password?: string }

  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    )
  }

  if (typeof body.password !== "string" || body.password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    )
  }

  try {
    const updated = await resetAdministrationUserPassword({
      userId,
      password: body.password
    })

    const auditContext = await getRequestAuditContext()
    await recordUserAuditEvent({
      targetUserId: updated.id,
      actorUserId,
      actorType: "admin",
      action: "admin.user.reset_password",
      resourceType: "administration_user_password",
      resourceId: updated.id,
      summary: "System admin reset user password.",
      ...auditContext
    })

    return NextResponse.json({ ok: true, user: updated })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reset password."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
