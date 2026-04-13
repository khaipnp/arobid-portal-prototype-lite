"use client"

import {
  CalendarIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleDashedIcon,
  CircleDotIcon,
  ClockIcon,
  SettingsIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  mockBoothCustomizations,
  mockBoothTemplates,
  mockExpos,
  mockSellerRegistrations,
} from "@/lib/tradexpo/mock-data"
import type {
  BoothTemplate,
  Expo,
  ExpoStatus,
  SellerBoothRegistration,
  SellerBoothStatus,
} from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"

const expoStatusStyles: Record<ExpoStatus, string> = {
  Draft: "border-slate-300 bg-slate-100 text-slate-700",
  "Pending Review": "border-amber-300 bg-amber-100 text-amber-700",
  Live: "border-emerald-300 bg-emerald-100 text-emerald-700",
  Ended: "border-zinc-300 bg-zinc-100 text-zinc-700",
  Archived: "border-purple-300 bg-purple-100 text-purple-700",
  Canceled: "border-rose-300 bg-rose-100 text-rose-700",
}

const boothStatusStyles: Record<SellerBoothStatus, string> = {
  "Pending Setup": "border-amber-300 bg-amber-100 text-amber-700",
  Configured: "border-blue-300 bg-blue-100 text-blue-700",
  Approved: "border-teal-300 bg-teal-100 text-teal-700",
  Live: "border-emerald-300 bg-emerald-100 text-emerald-700",
  Ended: "border-zinc-300 bg-zinc-100 text-zinc-700",
}

const boothStatusIcon: Record<SellerBoothStatus, React.ReactNode> = {
  "Pending Setup": <CircleDashedIcon className="h-3.5 w-3.5" />,
  Configured: <CircleDotIcon className="h-3.5 w-3.5" />,
  Approved: <CheckCircle2Icon className="h-3.5 w-3.5" />,
  Live: <CheckCircle2Icon className="h-3.5 w-3.5" />,
  Ended: <ClockIcon className="h-3.5 w-3.5" />,
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(iso),
  )
}

interface Props {
  expoId: string
}

export function SellerExpoDetail({ expoId }: Props) {
  const expo = React.useMemo<Expo | undefined>(
    () => mockExpos.find((e) => e.id === expoId),
    [expoId],
  )

  const registrations = React.useMemo<SellerBoothRegistration[]>(
    () =>
      mockSellerRegistrations
        .filter((r) => r.expoId === expoId)
        .map((r) => ({ ...r })),
    [expoId],
  )

  const boothTemplateMap = React.useMemo(() => {
    const m = new Map<string, BoothTemplate>()
    for (const bt of mockBoothTemplates) m.set(bt.id, bt)
    return m
  }, [])

  const customizationMap = React.useMemo(() => {
    const m = new Map<string, { publishStatus: string; hasTemplate: boolean }>()
    for (const c of mockBoothCustomizations) {
      m.set(c.registrationId, {
        publishStatus: c.publishStatus,
        hasTemplate: !!c.selectedBoothTemplateId,
      })
    }
    return m
  }, [])

  if (!expo) {
    return (
      <p className="py-12 text-center text-muted-foreground text-sm">
        Expo not found.
      </p>
    )
  }

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
            className="h-[100px] w-[160px] object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-lg">{expo.name}</h2>
            <Badge
              variant="outline"
              className={cn("text-xs", expoStatusStyles[expo.status])}
            >
              {expo.status}
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

      {/* Booth list */}
      <section>
        <h3 className="mb-3 font-semibold text-base">My Booths in This Expo</h3>
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
                    <TableCell className="font-mono font-medium">
                      {reg.boothRef}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {template && (
                          <Image
                            src={`https://picsum.photos/seed/${reg.boothTemplateId}/80/60`}
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
                          boothStatusStyles[reg.status],
                        )}
                      >
                        {boothStatusIcon[reg.status]}
                        {reg.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!customization || !customization.hasTemplate ? (
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
