import { notFound } from "next/navigation"
import { PartnerExpoDetailTabs } from "@/components/partner/partner-expo-detail-tabs"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import {
  getPartnerAssignedExpo,
  getPartnerExpoExhibitors,
  getPartnerExpoOperationsDetail,
  getPartnerExpoReferralAnalytics,
  type PartnerReferralDateRange,
  type PartnerReferralShareChannel,
  partnerReferralDateRanges,
  partnerReferralShareChannels
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { listExpoPackageDisplays } from "@/lib/tradexpo/db/expo-package-displays"
import {
  listGoLIVEEvents,
  listStreamSessions
} from "@/lib/tradexpo/db/platform-data"

export const dynamic = "force-dynamic"

export default async function PartnerExpoDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ expoId: string }>
  searchParams: Promise<{
    tab?: string
    referralRange?: string
    referralChannel?: string
  }>
}) {
  const { expoId } = await params
  const filters = await searchParams
  const referralDateRange = partnerReferralDateRanges.includes(
    filters.referralRange as PartnerReferralDateRange
  )
    ? (filters.referralRange as PartnerReferralDateRange)
    : "30d"
  const referralChannel =
    filters.referralChannel === "all" ||
    partnerReferralShareChannels.includes(
      filters.referralChannel as PartnerReferralShareChannel
    )
      ? (filters.referralChannel as PartnerReferralShareChannel | "all")
      : "all"
  const initialTab = filters.tab === "referrals" ? "referrals" : "overview"
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const assignedExpo = await getPartnerAssignedExpo(userId, expoId)
  if (!assignedExpo) notFound()
  const { expo } = assignedExpo

  const [
    operations,
    exhibitorsWorkspace,
    packages,
    referralAnalytics,
    initialGoLIVEEvents,
    initialStreamSessions
  ] = await Promise.all([
    getPartnerExpoOperationsDetail(userId, expoId),
    getPartnerExpoExhibitors(userId, expoId),
    listExpoPackageDisplays(expoId),
    getPartnerExpoReferralAnalytics(userId, expoId, {
      dateRange: referralDateRange,
      channel: referralChannel
    }),
    listGoLIVEEvents(),
    listStreamSessions()
  ])

  if (!operations || !exhibitorsWorkspace || !referralAnalytics) notFound()

  return (
    <DashboardShell
      title={expo.name}
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Expo Programs", href: "/partner/expos" },
        { label: expo.name }
      ]}
      showBackButton
    >
      <PartnerExpoDetailTabs
        expoId={expoId}
        initialTab={initialTab}
        assignedExpo={assignedExpo}
        operations={operations}
        exhibitorsWorkspace={exhibitorsWorkspace}
        packages={packages}
        referralAnalytics={referralAnalytics}
        initialGoLIVEEvents={initialGoLIVEEvents}
        initialStreamSessions={initialStreamSessions}
      />
    </DashboardShell>
  )
}
