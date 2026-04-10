import Link from "next/link"
import { notFound } from "next/navigation"

import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { HallSlotManager } from "@/components/tradexpo/hall-slot-manager"
import { StatusBadge } from "@/components/tradexpo/status-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  mockAssets,
  mockHallTemplateSlots,
  mockHallTemplates,
  mockHallTemplateUsage,
} from "@/lib/tradexpo/mock-data"
import {
  formatDateTime,
  getAssetMap,
  getHallTemplateStatus,
} from "@/lib/tradexpo/utils"

export default async function HallTemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>
}) {
  const { templateId } = await params

  const template = mockHallTemplates.find((item) => item.id === templateId)

  if (!template) {
    notFound()
  }

  const usage = mockHallTemplateUsage.find(
    (item) => item.hallTemplateId === template.id,
  ) || {
    hallTemplateId: template.id,
    upcomingExpoCount: 0,
    liveExpoCount: 0,
    archivedExpoCount: 0,
  }

  const slotCount = mockHallTemplateSlots.filter(
    (slot) => slot.hallTemplateId === template.id,
  ).length

  const assetMap = getAssetMap(mockAssets)
  const status = getHallTemplateStatus(template, assetMap)

  return (
    <DashboardShell
      title="Hall Template Detail"
      description="US-02 UX: Keep hall context and slot configuration together in one page."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "TradeXpo", href: "/dashboard/tradexpo" },
        {
          label: "Hall Templates",
          href: "/dashboard/tradexpo/hall-templates",
        },
        { label: template.name },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {template.name}
              <StatusBadge status={status} />
            </CardTitle>
            <CardDescription>
              Unified detail page for template context, status tracking, and
              slot management.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <p>
              <span className="font-medium">Updated by:</span>{" "}
              {template.updatedBy}
            </p>
            <p>
              <span className="font-medium">Updated at:</span>{" "}
              {formatDateTime(template.updatedAt)}
            </p>
            <p>
              <span className="font-medium">Visibility:</span>{" "}
              {template.isPublic ? "Published" : "Draft"}
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
              Quick references before updating slot positions.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>
              <span className="font-medium">Total slots:</span> {slotCount}
            </p>
            <p>
              <span className="font-medium">Upcoming expos:</span>{" "}
              {usage.upcomingExpoCount}
            </p>
            <p>
              <span className="font-medium">Live expos:</span>{" "}
              {usage.liveExpoCount}
            </p>
            <p>
              <span className="font-medium">Archived expos:</span>{" "}
              {usage.archivedExpoCount}
            </p>
            <Button variant="outline" asChild className="mt-2">
              <Link href="/dashboard/tradexpo/hall-templates">
                Back to Hall Templates
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <HallSlotManager templateId={templateId} embedded />
    </DashboardShell>
  )
}
