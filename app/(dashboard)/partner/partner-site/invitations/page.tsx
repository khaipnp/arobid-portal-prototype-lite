import { PartnerSiteInvitationManager } from "@/components/partner/partner-site-invitation-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { requirePartnerTab } from "@/lib/partner/access"
import { getPartnerEnterpriseWorkspace } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerSiteInvitationsPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const [access, workspace] = await Promise.all([
    requirePartnerTab(userId, "enterprises"),
    getPartnerEnterpriseWorkspace(userId)
  ])
  const inviteBaseUrl =
    process.env.NEXT_PUBLIC_PARTNER_INVITE_BASE_URL ??
    "https://arobid.site/invite"

  return (
    <DashboardShell
      title="Invitations"
      description="Search, filter, and resend Partner Site invitations."
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        {
          label: "Partner Site Management",
          href: "/partner/partner-site/site-management"
        },
        { label: "Invitations" }
      ]}
    >
      <PartnerSiteInvitationManager
        access={access}
        workspace={workspace}
        inviteBaseUrl={inviteBaseUrl}
      />
    </DashboardShell>
  )
}
