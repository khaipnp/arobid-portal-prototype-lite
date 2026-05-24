import { NextResponse } from "next/server"
import {
  deleteAdministrationUser,
  getRequestAuditContext,
  recordUserAuditEvent,
  updateAdministrationUser
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
  let body: {
    userId?: string
    name?: string
    email?: string
    companyId?: string | null
    companyName?: string | null
    jobTitle?: string | null
    phone?: string | null
    website?: string | null
    location?: string | null
    avatarUrl?: string | null
    isActive?: boolean
  }
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
    const updated = await updateAdministrationUser({
      currentUserId: userId,
      nextUserId: body.userId ?? "",
      name: body.name ?? "",
      email: body.email ?? "",
      companyId: body.companyId ?? null,
      companyName: body.companyName ?? null,
      jobTitle: body.jobTitle ?? null,
      phone: body.phone ?? null,
      website: body.website ?? null,
      location: body.location ?? null,
      avatarUrl: body.avatarUrl ?? null,
      isActive: body.isActive
    })

    const auditContext = await getRequestAuditContext()
    await recordUserAuditEvent({
      targetUserId: updated.id,
      actorUserId: actorUserId === userId ? updated.id : actorUserId,
      actorType: "admin",
      action: "admin.user.update",
      resourceType: "administration_user_detail",
      resourceId: updated.id,
      summary: "System admin updated user detail.",
      metadata: {
        previousUserId: userId,
        nextUserId: updated.id
      },
      ...auditContext
    })

    return NextResponse.json({ ok: true, user: updated })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update user."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  const actorUserId = await requireRole("sys_admin")
  await ensurePlatformSchema()
  const { userId } = await params

  if (actorUserId === userId) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    )
  }

  try {
    const deleted = await deleteAdministrationUser(userId)
    return NextResponse.json({ ok: true, user: deleted })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
