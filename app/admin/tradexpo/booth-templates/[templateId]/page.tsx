import { notFound } from "next/navigation"
import { BoothTemplateDetailManager } from "@/components/tradexpo/booth-template-detail-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { StatusBadge } from "@/components/tradexpo/status-badge"
import { TemplateTranslationsDialog } from "@/components/tradexpo/template-translations-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  listBoothTemplates,
  listBoothTemplateUsage,
  listBoothTypes,
} from "@/lib/tradexpo/db/booth-templates"
import { listHallTemplateAssets } from "@/lib/tradexpo/db/hall-templates"
import {
  formatDateTime,
  getAssetMap,
  getBoothTemplateStatus,
} from "@/lib/tradexpo/utils"

export const dynamic = "force-dynamic"

export default async function BoothTemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>
}) {
  const { templateId } = await params

  const [assets, templates, usages, boothTypes] = await Promise.all([
    listHallTemplateAssets(),
    listBoothTemplates(),
    listBoothTemplateUsage(),
    listBoothTypes(),
  ])

  const template = templates.find((item) => item.id === templateId)

  if (!template) {
    notFound()
  }

  const usage = usages.find((item) => item.boothTemplateId === template.id) || {
    boothTemplateId: template.id,
    upcomingExpoBoothCount: 0,
    liveExpoBoothCount: 0,
    archivedExpoBoothCount: 0,
  }

  const boothTypeName =
    boothTypes.find((type) => type.id === template.boothTypeId)?.name ??
    "Unknown"

  const assetMap = getAssetMap(assets)
  const status = getBoothTemplateStatus(template, assetMap)

  return (
    <DashboardShell
      title="Booth Template Detail"
      description="View and manage booth template assets and translations."
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "TradeXpo", href: "/admin/tradexpo" },
        { label: "Booth Templates", href: "/admin/tradexpo/booth-templates" },
        { label: template.name },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle className="flex flex-wrap items-center gap-2">
                {template.name}
                <StatusBadge status={status} />
              </CardTitle>
              <TemplateTranslationsDialog
                templateName={template.name}
                initialTranslations={template.translations}
              />
            </div>
            <CardDescription>
              {template.description || "No description provided."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <p>
              <span className="font-medium">Booth Type:</span> {boothTypeName}
            </p>
            <p>
              <span className="font-medium">Visibility:</span>{" "}
              {template.isPublic ? "Published" : "Draft"}
            </p>
            <p>
              <span className="font-medium">Updated by:</span>{" "}
              {template.updatedBy}
            </p>
            <p>
              <span className="font-medium">Updated at:</span>{" "}
              {formatDateTime(template.updatedAt)}
            </p>
            <p>
              <span className="font-medium">Activation:</span>{" "}
              {template.isActive ? "Active" : "Inactive"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Snapshot</CardTitle>
            <CardDescription>
              Exhibitor booth references across expos.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>
              <span className="font-medium">Upcoming expo booths:</span>{" "}
              {usage.upcomingExpoBoothCount}
            </p>
            <p>
              <span className="font-medium">Live expo booths:</span>{" "}
              {usage.liveExpoBoothCount}
            </p>
            <p>
              <span className="font-medium">Archived expo booths:</span>{" "}
              {usage.archivedExpoBoothCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <BoothTemplateDetailManager
        initialTemplate={template}
        initialAssets={assets}
      />
    </DashboardShell>
  )
}
