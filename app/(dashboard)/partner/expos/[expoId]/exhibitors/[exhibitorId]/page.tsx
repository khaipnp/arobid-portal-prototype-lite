import { notFound } from "next/navigation"
import { PartnerExpoExhibitorDetailView } from "@/components/partner/partner-expo-exhibitor-detail"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import {
  getPartnerAssignedExpo,
  getPartnerExpoExhibitorDetail
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerExpoExhibitorDetailPage({
  params
}: {
  params: Promise<{ expoId: string; exhibitorId: string }>
}) {
  const { expoId, exhibitorId } = await params
  await ensurePlatformSchema()
  const userId = await requireRole("partner")

  const [assignedExpo, detail] = await Promise.all([
    getPartnerAssignedExpo(userId, expoId),
    getPartnerExpoExhibitorDetail(userId, expoId, exhibitorId)
  ])

  if (!assignedExpo || !detail) notFound()

  return (
    <DashboardShell
      title="Exhibitor Details"
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Expo Programs", href: "/partner/expos" },
        { label: assignedExpo.expo.name, href: `/partner/expos/${expoId}` },
        { label: detail.exhibitor.displayName }
      ]}
      showBackButton
    >
      <PartnerExpoExhibitorDetailView detail={detail} />
    </DashboardShell>
  )
}
