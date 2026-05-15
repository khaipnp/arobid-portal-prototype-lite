"use client"

import {
  Building2Icon,
  CheckCircle2Icon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  UsersIcon,
  ZapIcon
} from "lucide-react"
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type { PartnerAccess } from "@/lib/partner/access"
import type {
  PartnerEnterpriseMember,
  PartnerEnterpriseWorkspace
} from "@/lib/partner/db"

const numberFormat = new Intl.NumberFormat("en")

const statusLabels: Record<
  PartnerEnterpriseMember["activationStatus"],
  string
> = {
  invited: "Invited",
  registered: "Registered",
  profile_completed: "Profile completed",
  expo_activated: "Expo activated",
  rfq_generated: "RFQ generated"
}

const dealStageLabels: Record<string, string> = {
  rfq_generated: "RFQ generated",
  qualified: "Qualified",
  meeting_scheduled: "Meeting scheduled",
  proposal_sent: "Proposal sent",
  closed_won: "Closed won",
  closed_lost: "Closed lost"
}

const statusOrder: PartnerEnterpriseMember["activationStatus"][] = [
  "invited",
  "registered",
  "profile_completed",
  "expo_activated",
  "rfq_generated"
]

type FormMode = "add" | "edit" | null

export function PartnerEnterpriseManager({
  access,
  workspace
}: {
  access: PartnerAccess
  workspace: PartnerEnterpriseWorkspace
}) {
  const router = useRouter()
  const canManageEnterprises = access.actions["enterprise.manage"]
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    PartnerEnterpriseMember["activationStatus"] | "all"
  >("all")
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    enterpriseName: "",
    contactEmail: ""
  })
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return workspace.members.filter((member) => {
      if (statusFilter !== "all" && member.activationStatus !== statusFilter) {
        return false
      }
      if (!q) return true
      return (
        member.enterpriseName.toLowerCase().includes(q) ||
        (member.contactEmail ?? "").toLowerCase().includes(q)
      )
    })
  }, [workspace.members, query, statusFilter])

  const totals = useMemo(() => {
    return workspace.members.reduce(
      (acc, member) => {
        acc.quotaAllocated += member.quotaAllocatedQuantity
        acc.quotaConsumed += member.quotaConsumedQuantity
        acc.creditsAllocated += member.tradeCreditsAllocated
        acc.creditsConsumed += member.tradeCreditsConsumed
        return acc
      },
      {
        quotaAllocated: 0,
        quotaConsumed: 0,
        creditsAllocated: 0,
        creditsConsumed: 0
      }
    )
  }, [workspace.members])

  function openAdd() {
    setError(null)
    setEditingId(null)
    setForm({ enterpriseName: "", contactEmail: "" })
    setFormMode("add")
  }

  function openEdit(member: Required<PartnerEnterpriseMember>) {
    setError(null)
    setEditingId(member.id)
    setForm({
      enterpriseName: member.enterpriseName,
      contactEmail: member.contactEmail ?? ""
    })
    setFormMode("edit")
  }

  async function submitJson(
    url: string,
    method: "POST" | "PATCH",
    body?: unknown
  ) {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(url, {
        method,
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
      setFormMode(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.")
    } finally {
      setIsSaving(false)
    }
  }

  async function saveMember() {
    if (formMode === "add") {
      await submitJson("/api/partner/enterprise-members", "POST", form)
    } else if (formMode === "edit" && editingId) {
      await submitJson(
        `/api/partner/enterprise-members/${editingId}`,
        "PATCH",
        form
      )
    }
  }

  async function advanceMember(memberId: string) {
    await submitJson(
      `/api/partner/enterprise-members/${memberId}/advance`,
      "POST"
    )
  }

  return (
    <div className="space-y-4 px-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Members"
          value={numberFormat.format(workspace.members.length)}
          note="Partner community directory"
          icon={<UsersIcon />}
        />
        <MetricCard
          title="Expo Activated"
          value={numberFormat.format(workspace.funnel.expoActivated)}
          note="Ready for expo participation"
          icon={<Building2Icon />}
        />
        <MetricCard
          title="Quota Support"
          value={numberFormat.format(totals.quotaAllocated)}
          note={`${numberFormat.format(totals.quotaConsumed)} consumed`}
          icon={<CheckCircle2Icon />}
        />
        <MetricCard
          title="TradeCredits"
          value={numberFormat.format(totals.creditsAllocated)}
          note={`${numberFormat.format(totals.creditsConsumed)} consumed`}
          icon={<ZapIcon />}
        />
      </section>

      {message ? (
        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Enterprise Directory</CardTitle>
                <CardDescription>
                  Members linked to current partner organization.
                </CardDescription>
              </div>
              {canManageEnterprises ? (
                <Button size="sm" onClick={openAdd}>
                  <PlusIcon />
                  Add enterprise
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <InputGroup className="max-w-sm">
                <InputGroupAddon>
                  <SearchIcon className="h-4 w-4 text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search enterprise..."
                />
              </InputGroup>
              <NativeSelect
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | PartnerEnterpriseMember["activationStatus"]
                      | "all"
                  )
                }
              >
                <option value="all">All statuses</option>
                {statusOrder.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </NativeSelect>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="flex min-h-52 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
                No enterprise members found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enterprise</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>DealContext</TableHead>
                    <TableHead className="text-right">Quota</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <p className="font-medium">{member.enterpriseName}</p>
                        <p className="text-muted-foreground text-xs">
                          {member.contactEmail || "No contact email"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {statusLabels[member.activationStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.dealContextStage ? (
                          <div className="space-y-1">
                            <Badge variant="secondary">
                              {dealStageLabels[member.dealContextStage] ??
                                member.dealContextStage}
                            </Badge>
                            <p className="text-muted-foreground text-xs">
                              {numberFormat.format(member.dealContextEvents)}{" "}
                              events
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No context
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numberFormat.format(member.quotaAllocatedQuantity)}
                        <span className="text-muted-foreground">
                          {" "}
                          / {numberFormat.format(member.quotaConsumedQuantity)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numberFormat.format(member.tradeCreditsAllocated)}
                        <span className="text-muted-foreground">
                          {" "}
                          / {numberFormat.format(member.tradeCreditsConsumed)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {canManageEnterprises ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(member)}
                            >
                              <PencilIcon />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              disabled={
                                member.activationStatus === "rfq_generated"
                              }
                              onClick={() => advanceMember(member.id)}
                            >
                              <SendIcon />
                              Advance
                            </Button>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <FunnelCard workspace={workspace} />
      </section>

      <Dialog
        open={formMode !== null}
        onOpenChange={(v) => !v && setFormMode(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formMode === "edit" ? "Edit Enterprise" : "Add Enterprise"}
            </DialogTitle>
            <DialogDescription>
              Enterprise member data stays scoped to current partner
              organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Enterprise name</Label>
              <Input
                value={form.enterpriseName}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    enterpriseName: event.target.value
                  }))
                }
                placeholder="Vietnam Textile Export Co."
              />
            </div>
            <div className="grid gap-2">
              <Label>Contact email</Label>
              <Input
                value={form.contactEmail}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    contactEmail: event.target.value
                  }))
                }
                placeholder="ops@example.com"
              />
            </div>
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormMode(null)}>
              Cancel
            </Button>
            <Button disabled={isSaving} onClick={saveMember}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FunnelCard({ workspace }: { workspace: PartnerEnterpriseWorkspace }) {
  const total = Math.max(workspace.members.length, 1)
  const items = [
    ["Invited", workspace.funnel.invited],
    ["Registered", workspace.funnel.registered],
    ["Profile completed", workspace.funnel.profileCompleted],
    ["Expo activated", workspace.funnel.expoActivated],
    ["RFQ generated", workspace.funnel.rfqGenerated]
  ] as const

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activation Funnel</CardTitle>
        <CardDescription>
          Invited to RFQ generation within partner program.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map(([label, value]) => (
          <div key={label} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{label}</span>
              <span className="tabular-nums">{numberFormat.format(value)}</span>
            </div>
            <Progress value={Math.round((value / total) * 100)} />
          </div>
        ))}
      </CardContent>
    </Card>
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
