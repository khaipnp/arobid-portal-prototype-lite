import { notFound } from "next/navigation"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { ExpoForm } from "@/components/tradexpo/expo-form"
import { requireRole } from "@/lib/auth/rbac"
import { getPartnerAssignedExpo } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  getExpoPackageFormWorkspace,
  listExpoPackageDisplays
} from "@/lib/tradexpo/db/expo-package-displays"
import { listHallTemplates } from "@/lib/tradexpo/db/hall-templates"
import {
  getLatestExpoMarketingContentForEdit,
  getUserById,
  listExpoCategories,
  listExpoHalls,
  listExpoLayoutTemplates
} from "@/lib/tradexpo/db/platform-data"

export const dynamic = "force-dynamic"

export default async function PartnerEditExpoPage({
  params
}: {
  params: Promise<{ expoId: string }>
}) {
  await ensurePlatformSchema()
  const { expoId } = await params
  const userId = await requireRole("partner")

  const assignedExpo = await getPartnerAssignedExpo(userId, expoId)
  if (!assignedExpo) notFound()

  const { expo, assignment } = assignedExpo
  const canEditDraft =
    assignment.partnershipModel !== "turnkey" &&
    expo.status === "Draft" &&
    assignment.capabilities.includes("edit_expo_content")
  if (!canEditDraft) notFound()

  const [
    categories,
    layoutTemplates,
    hallTemplates,
    halls,
    marketingVersion,
    packageWorkspace,
    initialPackages
  ] = await Promise.all([
    listExpoCategories(),
    listExpoLayoutTemplates(),
    listHallTemplates(),
    listExpoHalls(expoId),
    getLatestExpoMarketingContentForEdit(expoId),
    getExpoPackageFormWorkspace(),
    listExpoPackageDisplays(expoId)
  ])

  const initialOwner =
    expo.ownerUserId != null ? await getUserById(expo.ownerUserId) : null

  return (
    <DashboardShell
      title={`Edit: ${expo.name}`}
      description="Update expo information while it is still in Draft."
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Expo Programs", href: "/partner/expos" },
        { label: expo.name, href: `/partner/expos/${expoId}` },
        { label: "Edit" }
      ]}
      showBackButton
    >
      <ExpoForm
        mode="edit"
        editableScope="partner-content"
        expoId={expoId}
        initialExpo={expo}
        initialHalls={halls}
        initialOwner={initialOwner}
        categories={categories}
        layoutTemplates={layoutTemplates}
        hallTemplates={hallTemplates}
        packageWorkspace={packageWorkspace}
        initialPackages={initialPackages}
        initialMarketingContent={marketingVersion?.content}
        allowPackageEdit
        submitEndpoint={`/api/partner/expos/${expoId}`}
        successHref={`/partner/expos/${expoId}`}
        cancelHref={`/partner/expos/${expoId}`}
      />
    </DashboardShell>
  )
}
