import { PartnerMiniSiteReview } from "@/components/admin/partner/partner-mini-site-review"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { listPartnerMiniSitesForAdmin } from "@/lib/partner/admin"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

type MiniSiteReviewRow = {
  id: string
  version_label: string
  status: string
  reject_reason: string | null
  updated_at: string
}

export default async function AdminPartnerMiniSitePage({
  params
}: {
  params: Promise<{ partnerOrgId: string }>
}) {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const { partnerOrgId } = await params
  const versions = (await listPartnerMiniSitesForAdmin(
    partnerOrgId
  )) as MiniSiteReviewRow[]

  return (
    <DashboardShell
      title="Partner Mini-site Review"
      description="Review submitted Tenant mini-site versions before they become public."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Partners", href: "/admin/partners" },
        { label: partnerOrgId, href: `/admin/partners/${partnerOrgId}` },
        { label: "Mini-site Review" }
      ]}
    >
      <PartnerMiniSiteReview partnerOrgId={partnerOrgId} versions={versions} />
    </DashboardShell>
  )
}
