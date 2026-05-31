import { notFound } from "next/navigation"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { ExpoForm } from "@/components/tradexpo/expo-form"
import { requireRole } from "@/lib/auth/rbac"
import { getAuthenticatedUserById } from "@/lib/auth/service"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { listHallTemplates } from "@/lib/tradexpo/db/hall-templates"
import {
  getExpoById,
  getLatestExpoMarketingContentForEdit,
  getUserById,
  listExpoCategories,
  listExpoHalls,
  listExpoLayoutTemplates
} from "@/lib/tradexpo/db/platform-data"

export const dynamic = "force-dynamic"

export default async function EditExpoPage({
  params
}: {
  params: Promise<{ expoId: string }>
}) {
  await ensurePlatformSchema()
  const { expoId } = await params
  const userId = await requireRole("admin")
  const user = await getAuthenticatedUserById(userId)
  const isSuper = user?.roles.includes("sys_admin") ?? false

  const expo = await getExpoById(expoId)
  if (!expo) notFound()

  const [categories, layoutTemplates, hallTemplates, halls, marketingVersion] =
    await Promise.all([
      listExpoCategories(),
      listExpoLayoutTemplates(),
      listHallTemplates(),
      listExpoHalls(expoId),
      getLatestExpoMarketingContentForEdit(expoId)
    ])

  const initialOwner =
    expo.ownerUserId != null ? await getUserById(expo.ownerUserId) : null

  return (
    <DashboardShell
      title={`Edit: ${expo.name}`}
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "TradeXpo", href: "/admin/tradexpo" },
        { label: "Expo List", href: "/admin/tradexpo/expos" },
        { label: expo.name, href: `/admin/tradexpo/expos/${expoId}` },
        { label: "Edit" }
      ]}
      showBackButton
    >
      <ExpoForm
        mode="edit"
        expoId={expoId}
        initialExpo={expo}
        isSuper={isSuper}
        initialHalls={halls}
        initialOwner={initialOwner}
        categories={categories}
        layoutTemplates={layoutTemplates}
        hallTemplates={hallTemplates}
        initialMarketingContent={marketingVersion?.content}
      />
    </DashboardShell>
  )
}
