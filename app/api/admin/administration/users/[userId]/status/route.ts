import { NextResponse } from "next/server"
import {
  getRequestAuditContext,
  recordUserAuditEvent,
  updateAdministrationUserStatus
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
  let body: { isActive?: boolean }

  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    )
  }

  if (typeof body.isActive !== "boolean") {
    return NextResponse.json(
      { error: "Active status is required." },
      { status: 400 }
    )
  }

  try {
    const updated = await updateAdministrationUserStatus({
      userId,
      isActive: body.isActive
    })

    const auditContext = await getRequestAuditContext()
    await recordUserAuditEvent({
      targetUserId: updated.id,
      actorUserId,
      actorType: "admin",
      action: updated.isActive
        ? "admin.user.activate"
        : "admin.user.inactivate",
      resourceType: "administration_user_status",
      resourceId: updated.id,
      summary: updated.isActive
        ? "System admin activated user."
        : "System admin inactivated user.",
      metadata: {
        isActive: updated.isActive
      },
      ...auditContext
    })

    return NextResponse.json({ ok: true, user: updated })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update user status."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
