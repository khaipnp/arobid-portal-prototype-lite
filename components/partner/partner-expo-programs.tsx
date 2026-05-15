"use client"

import type { PartnerAccess } from "@/lib/partner/access"

import {
  BadgeCheckIcon,
  Building2Icon,
  CalendarPlusIcon,
  ClipboardListIcon,
  PackageCheckIcon,
  SendIcon
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { PartnerExpoProgramsWorkspace } from "@/lib/partner/db"
import { PartnerExpoList } from "./partner-expo-list"

const numberFormat = new Intl.NumberFormat("en")

const requestStatusLabels: Record<
  PartnerExpoProgramsWorkspace["turnkeyRequests"][number]["status"],
  string
> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  converted: "Converted"
}

export function PartnerExpoPrograms({
  access,
  workspace
}: {
  access: PartnerAccess
  workspace: PartnerExpoProgramsWorkspace
}) {
  const router = useRouter()
  const canCreateTurnkey = access.actions["turnkey.create"]
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [requestForm, setRequestForm] = useState({
    title: "",
    industry: "",
    targetStartDate: "",
    expectedEnterprises: "50",
    requestedBooths: "30",
    notes: ""
  })
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const summary = useMemo(() => {
    return workspace.assignedExpos.reduce(
      (acc, item) => {
        acc.assigned += 1
        if (item.assignment.partnershipModel === "co_host") acc.coHost += 1
        if (item.assignment.partnershipModel === "turnkey") acc.turnkey += 1
        if (item.assignment.partnershipModel === "tenant") acc.tenant += 1
        acc.booths += item.totalBooths
        acc.soldBooths += item.soldBooths
        return acc
      },
      {
        assigned: 0,
        coHost: 0,
        turnkey: 0,
        tenant: 0,
        booths: 0,
        soldBooths: 0
      }
    )
  }, [workspace.assignedExpos])

  const bulkQuotas = workspace.quotaWorkspace.quotas.filter(
    (quota) => quota.quotaType === "bulk_booth_inventory"
  )
  const bulkTotal = bulkQuotas.reduce(
    (acc, quota) => {
      acc.total += quota.totalQuantity
      acc.available += quota.availableQuantity
      acc.allocated += quota.allocatedQuantity
      acc.consumed += quota.consumedQuantity
      return acc
    },
    { total: 0, available: 0, allocated: 0, consumed: 0 }
  )

  async function submitTurnkeyRequest() {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/partner/turnkey-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...requestForm,
          expectedEnterprises: Number(requestForm.expectedEnterprises),
          requestedBooths: Number(requestForm.requestedBooths)
        })
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error ?? "Create request failed.")
      }
      setShowRequestDialog(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create request failed.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Assigned Programs"
          value={numberFormat.format(summary.assigned)}
          note={`${numberFormat.format(summary.coHost)} co-host / ${numberFormat.format(summary.turnkey)} turnkey`}
          icon={<Building2Icon />}
        />
        <MetricCard
          title="Turnkey Requests"
          value={numberFormat.format(workspace.turnkeyRequests.length)}
          note="Arobid creates and publishes approved expos"
          icon={<CalendarPlusIcon />}
        />
        <MetricCard
          title="Bulk Inventory"
          value={numberFormat.format(bulkTotal.available)}
          note={`${numberFormat.format(bulkTotal.allocated)} allocated / ${numberFormat.format(bulkTotal.consumed)} consumed`}
          icon={<PackageCheckIcon />}
        />
        <MetricCard
          title="Booth Utilization"
          value={`${summary.booths > 0 ? Math.round((summary.soldBooths / summary.booths) * 100) : 0}%`}
          note={`${numberFormat.format(summary.soldBooths)} / ${numberFormat.format(summary.booths)} booths`}
          icon={<BadgeCheckIcon />}
        />
      </section>

      <section className="grid gap-4 px-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Turnkey Expo Requests</CardTitle>
                <CardDescription>
                  Partner submits setup needs; Arobid remains control plane for
                  create and publish.
                </CardDescription>
              </div>
              {canCreateTurnkey ? (
                <Button size="sm" onClick={() => setShowRequestDialog(true)}>
                  <CalendarPlusIcon />
                  Request turnkey expo
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {workspace.turnkeyRequests.length === 0 ? (
              <EmptyState label="No turnkey requests yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead className="text-right">Booths</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspace.turnkeyRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {request.industry || "No industry specified"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">
                          {request.targetStartDate ?? "No target date"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {numberFormat.format(request.expectedEnterprises)}{" "}
                          enterprises
                        </p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numberFormat.format(request.requestedBooths)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {requestStatusLabels[request.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulk Booth Distribution</CardTitle>
            <CardDescription>
              Bulk inventory is managed through quota allocation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bulkQuotas.length === 0 ? (
              <EmptyState label="No bulk booth inventory quota yet." />
            ) : (
              <div className="space-y-3">
                {bulkQuotas.map((quota) => (
                  <div key={quota.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{quota.label}</p>
                        <p className="text-muted-foreground text-xs">
                          Available{" "}
                          {numberFormat.format(quota.availableQuantity)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {numberFormat.format(quota.totalQuantity)} total
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-md bg-muted p-2">
                        <p className="font-semibold tabular-nums">
                          {numberFormat.format(quota.availableQuantity)}
                        </p>
                        <p className="text-muted-foreground">Available</p>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <p className="font-semibold tabular-nums">
                          {numberFormat.format(quota.allocatedQuantity)}
                        </p>
                        <p className="text-muted-foreground">Allocated</p>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <p className="font-semibold tabular-nums">
                          {numberFormat.format(quota.consumedQuantity)}
                        </p>
                        <p className="text-muted-foreground">Consumed</p>
                      </div>
                    </div>
                  </div>
                ))}
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/partner/quota">
                    <SendIcon />
                    Allocate bulk inventory
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <PartnerExpoList access={access} assignedExpos={workspace.assignedExpos} />

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Turnkey Expo</DialogTitle>
            <DialogDescription>
              Submit program requirements. Arobid creates, configures, and
              publishes after approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Program title">
              <Input
                value={requestForm.title}
                onChange={(event) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    title: event.target.value
                  }))
                }
                placeholder="Vietnam SME Export Expo 2026"
              />
            </Field>
            <Field label="Industry">
              <Input
                value={requestForm.industry}
                onChange={(event) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    industry: event.target.value
                  }))
                }
                placeholder="Manufacturing, Agriculture, Logistics"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Target date">
                <Input
                  type="date"
                  value={requestForm.targetStartDate}
                  onChange={(event) =>
                    setRequestForm((prev) => ({
                      ...prev,
                      targetStartDate: event.target.value
                    }))
                  }
                />
              </Field>
              <Field label="Enterprises">
                <Input
                  type="number"
                  min={0}
                  value={requestForm.expectedEnterprises}
                  onChange={(event) =>
                    setRequestForm((prev) => ({
                      ...prev,
                      expectedEnterprises: event.target.value
                    }))
                  }
                />
              </Field>
              <Field label="Booths">
                <Input
                  type="number"
                  min={0}
                  value={requestForm.requestedBooths}
                  onChange={(event) =>
                    setRequestForm((prev) => ({
                      ...prev,
                      requestedBooths: event.target.value
                    }))
                  }
                />
              </Field>
            </div>
            <Field label="Notes">
              <Textarea
                value={requestForm.notes}
                onChange={(event) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    notes: event.target.value
                  }))
                }
                placeholder="Program goals, expected sectors, support scope..."
              />
            </Field>
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRequestDialog(false)}
            >
              Cancel
            </Button>
            <Button disabled={isSaving} onClick={submitTurnkeyRequest}>
              {isSaving ? "Submitting..." : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetricCard({
  title,
  value,
  note,
  icon
}: {
  title: string
  value: string
  note: string
  icon: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-semibold text-2xl tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-muted-foreground text-xs [&_svg]:h-4 [&_svg]:w-4">
        {icon}
        <span>{note}</span>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
      <ClipboardListIcon className="mr-2 h-4 w-4" />
      {label}
    </div>
  )
}
