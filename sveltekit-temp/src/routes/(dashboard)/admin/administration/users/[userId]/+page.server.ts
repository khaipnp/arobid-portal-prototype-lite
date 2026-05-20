import { error } from "@sveltejs/kit"
import {
  getAdministrationUserDetail,
  getRequestAuditContext,
  recordUserAuditEvent
} from "$lib/administration/user-detail"
import { requireRole } from "$lib/auth/rbac"
import { ensurePlatformSchema } from "$lib/platform/ensure-schema"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async (event) => {
  const actorUserId = await requireRole(event, "sys_admin")
  await ensurePlatformSchema()

  const userId = event.params.userId
  const auditContext = await getRequestAuditContext(event.request)

  await recordUserAuditEvent({
    targetUserId: userId,
    actorUserId,
    actorType: "admin",
    action: "admin.user.view",
    resourceType: "administration_user_detail",
    resourceId: userId,
    summary: "Admin viewed user detail.",
    metadata: { surface: "admin.administration.users.detail" },
    ...auditContext
  })

  const user = await getAdministrationUserDetail(userId)
  if (!user) {
    throw error(404, "User not found")
  }

  return { user }
}
