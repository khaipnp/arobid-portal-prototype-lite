"use client"

import {
  CalendarIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleDashedIcon,
  CircleDotIcon,
  ClockIcon,
  EyeIcon,
  FileTextIcon,
  MessageSquareIcon,
  PackageIcon,
  SettingsIcon,
  TrendingUpIcon,
  UsersIcon
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import { GoLIVESection } from "@/components/tradexpo/golive-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { getAssetUrl } from "@/lib/image-utils"
import type {
  BoothCustomization,
  BoothTemplate,
  CompanyProduct,
  Expo,
  ExpoStatus,
  GoLIVEEvent,
  SellerBoothRegistration,
  SellerBoothStatus,
  StreamSession
} from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"
import { Label } from "../ui/label"

type SellerExpoViewStatus = "Upcoming" | "Live" | "Archive"

const expoStatusStyles: Record<SellerExpoViewStatus, string> = {
  Upcoming: "border-amber-300 bg-amber-100 text-amber-700",
  Live: "border-emerald-300 bg-emerald-100 text-emerald-700",
  Archive: "border-zinc-300 bg-zinc-100 text-zinc-700"
}

function toSellerExpoViewStatus(status: ExpoStatus): SellerExpoViewStatus {
  if (status === "Live") return "Live"
  if (status === "Ended" || status === "Archived" || status === "Canceled") {
    return "Archive"
  }
  return "Upcoming"
}

const boothStatusStyles: Record<SellerBoothStatus, string> = {
  "Pending Setup": "border-amber-300 bg-amber-100 text-amber-700",
  Configured: "border-blue-300 bg-blue-100 text-blue-700",
  Approved: "border-teal-300 bg-teal-100 text-teal-700",
  Live: "border-emerald-300 bg-emerald-100 text-emerald-700",
  Ended: "border-zinc-300 bg-zinc-100 text-zinc-700"
}

const boothStatusIcon: Record<SellerBoothStatus, React.ReactNode> = {
  "Pending Setup": <CircleDashedIcon className="h-3.5 w-3.5" />,
  Configured: <CircleDotIcon className="h-3.5 w-3.5" />,
  Approved: <CheckCircle2Icon className="h-3.5 w-3.5" />,
  Live: <CheckCircle2Icon className="h-3.5 w-3.5" />,
  Ended: <ClockIcon className="h-3.5 w-3.5" />
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(iso)
  )
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(iso))
}

function StatCard({
  title,
  value,
  icon,
  trend,
  description
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  description?: string
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="font-bold text-2xl">{value}</div>
          {trend && (
            <div className="flex items-center text-emerald-600 text-xs font-medium">
              <TrendingUpIcon className="mr-0.5 h-3 w-3" />
              {trend}
            </div>
          )}
        </div>
        {description && (
          <p className="mt-1 text-muted-foreground text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

interface Props {
  expoId: string
  expo: Expo | null
  registrations: SellerBoothRegistration[]
  boothTemplates: BoothTemplate[]
  boothCustomizations: BoothCustomization[]
  goLiveEvents: GoLIVEEvent[]
  streamSessions: StreamSession[]
  companyProducts: CompanyProduct[]
}

export function SellerExpoDetail({
  expoId,
  expo,
  registrations,
  boothTemplates,
  boothCustomizations,
  goLiveEvents,
  streamSessions,
  companyProducts
}: Props) {
  const boothTemplateMap = React.useMemo(() => {
    const m = new Map<string, BoothTemplate>()
    for (const bt of boothTemplates) m.set(bt.id, bt)
    return m
  }, [boothTemplates])

  const customizationMap = React.useMemo(() => {
    const m = new Map<string, { publishStatus: string; hasTemplate: boolean }>()
    for (const c of boothCustomizations) {
      m.set(c.registrationId, {
        publishStatus: c.publishStatus,
        hasTemplate: !!c.selectedBoothTemplateId
      })
    }
    return m
  }, [boothCustomizations])

  const productMap = React.useMemo(() => {
    const m = new Map<string, CompanyProduct>()
    for (const p of companyProducts) m.set(p.id, p)
    return m
  }, [companyProducts])

  const { stats, seed } = React.useMemo(() => {
    // In a real app, these would come from an analytics API.
    // For this prototype, we'll derive some and mock others based on expoId.
    const s = expoId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const mockValue = (min: number, max: number) =>
      Math.floor((s % (max - min)) + min)

    const peakViewers = streamSessions.reduce(
      (acc, sess) => acc + (sess.peakViewerCount ?? 0),
      0
    )

    // Get product IDs displayed in this expo
    const displayedProductIds = Array.from(
      new Set(boothCustomizations.flatMap((c) => c.products.map((p) => p.id)))
    )

    // Match with company products to ensure data integrity
    const expoProducts = displayedProductIds
      .map((id) => productMap.get(id))
      .filter((p): p is CompanyProduct => !!p)

    const topViewedProduct =
      expoProducts.length > 0 ? expoProducts[s % expoProducts.length] : null
    const topRFQProduct =
      expoProducts.length > 0
        ? expoProducts[(s + 1) % expoProducts.length]
        : null

    return {
      seed: s,
      stats: {
        visitors: mockValue(500, 2000),
        clicks: mockValue(200, 1000),
        leads: mockValue(10, 50),
        streamViews: peakViewers || mockValue(100, 500),
        topViewed: topViewedProduct,
        topViewedCount: mockValue(50, 200),
        topRFQ: topRFQProduct,
        topRFQCount: mockValue(5, 20)
      }
    }
  }, [expoId, streamSessions, boothCustomizations, productMap])

  const latestRfqs = React.useMemo(() => {
    const statuses = ["New", "Quoted", "Closed"] as const
    const displayedProductIds = Array.from(
      new Set(boothCustomizations.flatMap((c) => c.products.map((p) => p.id)))
    )
    const expoProducts = displayedProductIds
      .map((id) => productMap.get(id))
      .filter((p): p is CompanyProduct => !!p)

    const total = Math.max(4, Math.min(10, expoProducts.length * 2 || 6))

    return Array.from({ length: total }).map((_, index) => {
      const createdAt = new Date(
        Date.now() - (index * 7 + (seed % 5)) * 60 * 60 * 1000
      )
      const expiredAt = new Date(
        createdAt.getTime() + (30 + (index % 3) * 30) * 24 * 60 * 60 * 1000
      )
      const product = expoProducts[index % expoProducts.length]
      const status = statuses[index % statuses.length]

      return {
        id: `rfq-${expoId}-${index + 1}`,
        buyerCompany: `Buyer Company ${index + 1}`,
        productName: product?.name ?? `Product ${index + 1}`,
        productImage: product?.mainImageUrl ?? expo?.thumbnailUrl ?? "",
        quantity: (index + 1) * 10,
        targetPrice: `${(1000 + index * 75).toLocaleString()} USD`,
        createdAt: createdAt.toISOString(),
        expiredAt: expiredAt.toISOString(),
        status
      }
    })
  }, [boothCustomizations, expo?.thumbnailUrl, expoId, productMap, seed])

  if (!expo) {
    return (
      <p className="py-12 text-center text-muted-foreground text-sm">
        Expo not found.
      </p>
    )
  }

  const displayStatus = toSellerExpoViewStatus(expo.status)

  const canConfigure = (status: SellerBoothStatus) =>
    status !== "Ended" &&
    status !== ("Canceled" as unknown as SellerBoothStatus)

  return (
    <div className="grid gap-6">
      {/* Expo info header */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-start">
        <div className="relative hidden shrink-0 overflow-hidden rounded-lg sm:block">
          <Image
            src={expo.thumbnailUrl}
            alt={expo.name}
            width={160}
            height={100}
            className="h-25 w-40 object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-lg">{expo.name}</h2>
            <Badge
              variant="outline"
              className={cn("text-xs", expoStatusStyles[displayStatus])}
            >
              {displayStatus}
            </Badge>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-muted-foreground text-sm">
            <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
            {formatDate(expo.startDate)} – {formatDate(expo.endDate)}
          </p>
          <p className="mt-0.5 text-muted-foreground text-sm">
            {registrations.length} booth{registrations.length !== 1 ? "s" : ""}{" "}
            purchased
          </p>
        </div>
      </div>

      {/* Stats Widgets */}
      {displayStatus !== "Upcoming" && (
        <div className="flex items-start gap-4">
          <div className="w-2/3 flex flex-col space-y-4">
            <h3 className="font-semibold text-base">Stats</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Booth Visitors"
                value={stats.visitors.toLocaleString()}
                icon={<UsersIcon className="h-4 w-4" />}
                trend={`${(seed % 15) + 5}%`}
                description="Unique visitors across booths"
              />
              <StatCard
                title="Product Clicks"
                value={stats.clicks.toLocaleString()}
                icon={<PackageIcon className="h-4 w-4" />}
                trend={`${(seed % 10) + 2}%`}
                description="Catalog engagement"
              />
              <StatCard
                title="New Leads"
                value={stats.leads}
                icon={<MessageSquareIcon className="h-4 w-4" />}
                trend={`${(seed % 20) + 10}%`}
                description="Inquiries & contacts"
              />
              <StatCard
                title="Peak Viewers"
                value={stats.streamViews.toLocaleString()}
                icon={<EyeIcon className="h-4 w-4" />}
                description="Max concurrent on streams"
              />
              <StatCard
                title="Most Viewed Product"
                value={stats.topViewed?.name ?? "N/A"}
                icon={<EyeIcon className="h-4 w-4" />}
                description={`${stats.topViewedCount} views`}
              />
              <StatCard
                title="Top RFQ Product"
                value={stats.topRFQ?.name ?? "N/A"}
                icon={<MessageSquareIcon className="h-4 w-4" />}
                description={`${stats.topRFQCount} quotation requests`}
              />
            </div>
          </div>

          {/* Latest RFQ with scroll */}
          <section className="w-1/3 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Latest RFQ</h3>
              <Badge variant="outline">{latestRfqs.length} RFQs</Badge>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <ScrollArea className="h-74">
                <div className="divide-y">
                  {latestRfqs.map((rfq) => (
                    <div
                      key={rfq.id}
                      className="w-full cursor-pointer flex gap-3 px-3 py-2 hover:bg-muted/50"
                    >
                      <div className="flex-1 flex flex-col min-w-0 space-y-3 py-1">
                        <div className="w-full flex justify-between items-center">
                          <p className="flex-1 line-clamp-1 text-foreground text-sm font-medium">
                            {rfq.buyerCompany}
                          </p>
                          <Badge
                            variant="ghost"
                            className={cn(
                              rfq.status === "New" && "text-blue-700",
                              rfq.status === "Quoted" && "text-amber-700",
                              rfq.status === "Closed" && "text-zinc-700"
                            )}
                          >
                            {rfq.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Image
                            src={rfq.productImage}
                            alt={rfq.productName}
                            width={64}
                            height={64}
                            className="size-12 border aspect-square rounded-2xl"
                          />

                          {/* RFQ Details */}
                          <div className="flex-1 flex flex-col gap-1">
                            <p className="line-clamp-1 text-sm">
                              {rfq.productName}
                            </p>
                            <div className="flex justify-between">
                              <div className="flex flex-col gap-0.5">
                                <Label className="text-muted-foreground text-xs font-normal">
                                  Created
                                </Label>
                                <p className="text-foreground text-xs">
                                  {formatDateTime(rfq.createdAt)}
                                </p>
                              </div>

                              <div className="flex flex-col gap-0.5">
                                <Label className="text-muted-foreground text-xs font-normal">
                                  Quantity:
                                </Label>
                                <p className="text-foreground text-xs">
                                  {rfq.quantity}
                                </p>
                              </div>

                              <div className="flex flex-col gap-0.5">
                                <Label className="text-muted-foreground text-xs font-normal">
                                  Expired date:
                                </Label>
                                <p className="text-foreground text-xs">
                                  {formatDate(rfq.expiredAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </section>
        </div>
      )}

      {/* GoLIVE Sessions */}
      <GoLIVESection
        expoId={expoId}
        expoStatus={expo.status}
        goLiveEvents={goLiveEvents}
        streamSessions={streamSessions}
      />

      {/* Booth list */}
      <section>
        <h3 className="mb-3 font-semibold text-base">My Booths</h3>
        <div className="rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-20">Ref</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Configuration</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((reg) => {
                const template = reg.boothTemplateId
                  ? boothTemplateMap.get(reg.boothTemplateId)
                  : undefined
                const customization = customizationMap.get(reg.id)
                const configurable = canConfigure(reg.status)

                return (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium font-mono">
                      {reg.boothRef}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {template && (
                          <Image
                            src={getAssetUrl(null, reg.boothTemplateId, 80, 60)}
                            alt={template.name}
                            width={40}
                            height={30}
                            className="rounded border object-cover"
                          />
                        )}

                        <span className="text-sm">
                          {template?.name ?? reg.boothTemplateId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{reg.boothTier}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "flex w-fit items-center gap-1 text-xs",
                          boothStatusStyles[reg.status]
                        )}
                      >
                        {boothStatusIcon[reg.status]}
                        {reg.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!customization?.hasTemplate ? (
                        <span className="text-muted-foreground text-sm">
                          No template
                        </span>
                      ) : customization.publishStatus === "Published" ? (
                        <span className="flex items-center gap-1 text-emerald-600 text-sm">
                          <CheckCircle2Icon className="h-3.5 w-3.5" />
                          Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-blue-600 text-sm">
                          <CircleDotIcon className="h-3.5 w-3.5" />
                          Draft
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {configurable ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/seller/my-expos/${expoId}/configure/${reg.id}`}
                          >
                            <SettingsIcon className="h-3.5 w-3.5" />
                            Configure
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/seller/my-expos/${expoId}/configure/${reg.id}`}
                          >
                            View
                            <ChevronRightIcon className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
