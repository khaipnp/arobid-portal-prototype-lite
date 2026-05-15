"use client"

import type { PartnerAccess } from "@/lib/partner/access"

import {
  BanknoteIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  FileClockIcon,
  PlusIcon,
  ReceiptTextIcon
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type {
  PartnerFinanceWorkspace,
  PartnerSettlement
} from "@/lib/partner/db"

const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1
})

export function PartnerFinanceManager({
  access,
  workspace
}: {
  access: PartnerAccess
  workspace: PartnerFinanceWorkspace
}) {
  const router = useRouter()
  const canManageSettlements = access.actions["settlement.manage"]
  const [cycleMonth, setCycleMonth] = useState(workspace.cycleOptions[0] ?? "")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function submitJson(url: string, body?: unknown) {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error ?? "Request failed.")
      }
      setMessage("Saved.")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4 px-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Recorded Revenue"
          value={currencyFormat.format(workspace.totals.recordedRevenue)}
          note="Gross platform-controlled revenue"
          icon={<CircleDollarSignIcon />}
        />
        <MetricCard
          title="Partner Share"
          value={currencyFormat.format(workspace.totals.partnerShare)}
          note={`${currencyFormat.format(workspace.totals.arobidShare)} Arobid share`}
          icon={<BanknoteIcon />}
        />
        <MetricCard
          title="Pending Settlement"
          value={currencyFormat.format(workspace.totals.pendingSettlement)}
          note="Monthly settlement not paid"
          icon={<FileClockIcon />}
        />
        <MetricCard
          title="Settled"
          value={currencyFormat.format(workspace.totals.settledSettlement)}
          note="Closed partner settlement"
          icon={<CheckCircle2Icon />}
        />
      </section>

      {message ? (
        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
          {message}
        </div>
      ) : null}
      {error ? <div className="text-destructive text-sm">{error}</div> : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Settlement Cycles</CardTitle>
                <CardDescription>
                  Monthly partner settlement generated from revenue events.
                </CardDescription>
              </div>
              {canManageSettlements ? (
                <div className="flex gap-2">
                  <NativeSelect
                    value={cycleMonth}
                    onChange={(event) => setCycleMonth(event.target.value)}
                  >
                    {workspace.cycleOptions.length === 0 ? (
                      <option value="">No revenue cycle</option>
                    ) : null}
                    {workspace.cycleOptions.map((cycle) => (
                      <option key={cycle} value={cycle}>
                        {cycle}
                      </option>
                    ))}
                  </NativeSelect>
                  <Button
                    size="sm"
                    disabled={!cycleMonth || isSaving}
                    onClick={() =>
                      submitJson("/api/partner/settlements", { cycleMonth })
                    }
                  >
                    <PlusIcon />
                    Generate
                  </Button>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {workspace.settlements.length === 0 ? (
              <EmptyState label="No settlement cycles yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Partner</TableHead>
                    <TableHead className="text-right">Arobid</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspace.settlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell>
                        <p className="font-medium">{settlement.cycleMonth}</p>
                        <p className="text-muted-foreground text-xs">
                          {settlement.settledAt
                            ? `Settled ${settlement.settledAt.slice(0, 10)}`
                            : "Monthly settlement"}
                        </p>
                      </TableCell>
                      <AmountCell value={settlement.grossAmount} />
                      <AmountCell value={settlement.partnerAmount} />
                      <AmountCell value={settlement.arobidAmount} />
                      <TableCell className="text-right">
                        <SettlementStatus settlement={settlement} />
                      </TableCell>
                      <TableCell className="text-right">
                        {canManageSettlements ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={settlement.status !== "pending" || isSaving}
                            onClick={() =>
                              submitJson(
                                `/api/partner/settlements/${settlement.id}/settle`
                              )
                            }
                          >
                            <ReceiptTextIcon />
                            Settle
                          </Button>
                        ) : null}
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
            <CardTitle>Revenue Events</CardTitle>
            <CardDescription>
              Platform billing events feeding settlement cycles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workspace.revenueEvents.length === 0 ? (
              <EmptyState label="No revenue events yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Partner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspace.revenueEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <p className="font-medium">{event.sourceType}</p>
                        <p className="text-muted-foreground text-xs">
                          {event.status} / {event.createdAt.slice(0, 10)}
                        </p>
                      </TableCell>
                      <AmountCell value={event.grossAmount} />
                      <AmountCell value={event.partnerAmount} />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
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

function AmountCell({ value }: { value: number }) {
  return (
    <TableCell className="text-right tabular-nums">
      {currencyFormat.format(value)}
    </TableCell>
  )
}

function SettlementStatus({ settlement }: { settlement: PartnerSettlement }) {
  return (
    <Badge variant={settlement.status === "settled" ? "secondary" : "outline"}>
      {settlement.status}
    </Badge>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
      {label}
    </div>
  )
}
