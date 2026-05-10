import { notFound } from "next/navigation"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { ExpoForm } from "@/components/tradexpo/expo-form"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { listHallTemplates } from "@/lib/tradexpo/db/hall-templates"
import {
  getExpoById,
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

  const expo = await getExpoById(expoId)
  if (!expo) notFound()

  const [categories, layoutTemplates, hallTemplates, halls] = await Promise.all(
    [
      listExpoCategories(),
      listExpoLayoutTemplates(),
      listHallTemplates(),
      listExpoHalls(expoId)
    ]
  )

  const initialOwner =
    expo.ownerUserId != null ? await getUserById(expo.ownerUserId) : null

  return (
    <DashboardShell
      title={`Edit: ${expo.name}`}
      description="Update metadata, schedule, owner, and hall configuration."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "TradeXpo", href: "/admin/tradexpo" },
        { label: "Expo List", href: "/admin/tradexpo/expos" },
        { label: expo.name, href: `/admin/tradexpo/expos/${expoId}` },
        { label: "Edit" }
      ]}
    >
      <ExpoForm
        mode="edit"
        expoId={expoId}
        initialExpo={expo}
        initialHalls={halls}
        initialOwner={initialOwner}
        categories={categories}
        layoutTemplates={layoutTemplates}
        hallTemplates={hallTemplates}
      />
    </DashboardShell>
  )
}
