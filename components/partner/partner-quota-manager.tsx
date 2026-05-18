"use client"

import {
  BadgeCheckIcon,
  KeyRoundIcon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
  UsersIcon
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
  PartnerInviteCampaign,
  PartnerQuota,
  PartnerQuotaWorkspace
} from "@/lib/partner/db"

const numberFormat = new Intl.NumberFormat("en")

type DialogMode =
  | "quota"
  | "member"
  | "campaign"
  | "allocate-quota"
  | "claim-code"
  | null

const quotaTypeLabels: Record<PartnerQuota["quotaType"], string> = {
  booth_credits: "Booth credits",
  expo_program_quota: "Expo program quota",
  bulk_booth_inventory: "Bulk booth inventory"
}

export function PartnerQuotaManager({
  access,
  workspace
}: {
  access: PartnerAccess
  workspace: PartnerQuotaWorkspace
}) {
  const router = useRouter()
  const canManageQuota = access.actions["quota.manage"]
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [quotaForm, setQuotaForm] = useState({
    quotaType: "booth_credits",
    label: "",
    totalQuantity: "10"
  })
  const [memberForm, setMemberForm] = useState({
    enterpriseName: "",
    contactEmail: ""
  })
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    inviteCode: "",
    quotaId: ""
  })
  const [quotaActionForm, setQuotaActionForm] = useState({
    quotaId: "",
    enterpriseMemberId: "",
    quantity: "1",
    action: "allocate"
  })
  const [claimForm, setClaimForm] = useState({
    campaignId: "",
    enterpriseMemberId: ""
  })
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const totals = useMemo(() => {
    return workspace.quotas.reduce(
      (acc, quota) => {
        acc.total += quota.totalQuantity
        acc.available += quota.availableQuantity
        acc.allocated += quota.allocatedQuantity
        acc.consumed += quota.consumedQuantity
        return acc
      },
      { total: 0, available: 0, allocated: 0, consumed: 0 }
    )
  }, [workspace.quotas])

  function open(mode: DialogMode) {
    setError(null)
    setMessage(null)
    setDialogMode(mode)
  }

  async function submitJson(url: string, body: unknown) {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error ?? "Request failed.")
      }
      setDialogMode(null)
      setMessage("Saved.")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSave() {
    if (dialogMode === "quota") {
      await submitJson("/api/partner/quotas", {
        quotaType: quotaForm.quotaType,
        label: quotaForm.label,
        totalQuantity: Number(quotaForm.totalQuantity)
      })
    } else if (dialogMode === "member") {
      await submitJson("/api/partner/enterprise-members", memberForm)
    } else if (dialogMode === "campaign") {
      await submitJson("/api/partner/invite-campaigns", {
        name: campaignForm.name,
        inviteCode: campaignForm.inviteCode,
        quotaId: campaignForm.quotaId || null,
        status: "active"
      })
    } else if (dialogMode === "allocate-quota") {
      const action = quotaActionForm.action
      await submitJson(
        `/api/partner/quotas/${quotaActionForm.quotaId}/${action}`,
        {
          enterpriseMemberId: quotaActionForm.enterpriseMemberId,
          quantity: Number(quotaActionForm.quantity)
        }
      )
    } else if (dialogMode === "claim-code") {
      await submitJson(
        `/api/partner/invite-campaigns/${claimForm.campaignId}/claim`,
        {
          enterpriseMemberId: claimForm.enterpriseMemberId || null
        }
      )
    }
  }

  return (
    <div className="space-y-4 px-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Available Quota"
          value={numberFormat.format(totals.available)}
          note={`${numberFormat.format(totals.total)} total quota`}
          icon={<BadgeCheckIcon />}
        />
        <MetricCard
          title="Allocated"
          value={numberFormat.format(totals.allocated)}
          note="Reserved for enterprises"
          icon={<SendIcon />}
        />
        <MetricCard
          title="Consumed"
          value={numberFormat.format(totals.consumed)}
          note="Activated or claimed"
          icon={<RefreshCwIcon />}
        />
        <MetricCard
          title="Invite Campaigns"
          value={numberFormat.format(workspace.inviteCampaigns.length)}
          note="Active partner code programs"
          icon={<KeyRoundIcon />}
        />
      </section>

      {message ? (
        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
          {message}
        </div>
      ) : null}

      {canManageQuota ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => open("quota")}>
            <PlusIcon />
            Add quota
          </Button>
          <Button size="sm" variant="outline" onClick={() => open("member")}>
            <UsersIcon />
            Add enterprise
          </Button>
          <Button size="sm" variant="outline" onClick={() => open("campaign")}>
            <KeyRoundIcon />
            Create invite code
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={workspace.quotas.length === 0}
            onClick={() => open("allocate-quota")}
          >
            <SendIcon />
            Allocate / consume quota
          </Button>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <QuotaTable quotas={workspace.quotas} />
        <CampaignTable
          campaigns={workspace.inviteCampaigns}
          onClaim={
            canManageQuota
              ? (campaign) => {
                  setClaimForm({
                    campaignId: campaign.id,
                    enterpriseMemberId: workspace.enterpriseMembers[0]?.id ?? ""
                  })
                  open("claim-code")
                }
              : undefined
          }
        />
      </section>

      <section>
        <EnterpriseTable members={workspace.enterpriseMembers} />
      </section>

      <Dialog open={dialogMode !== null} onOpenChange={(v) => !v && open(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{getDialogTitle(dialogMode)}</DialogTitle>
            <DialogDescription>
              Changes persist to Neon and refresh the Partner Portal view.
            </DialogDescription>
          </DialogHeader>
          {renderDialogBody()}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => open(null)}>
              Cancel
            </Button>
            <Button disabled={isSaving} onClick={handleSave}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  function renderDialogBody() {
    if (dialogMode === "quota") {
      return (
        <div className="grid gap-3">
          <Field label="Type">
            <NativeSelect
              value={quotaForm.quotaType}
              onChange={(e) =>
                setQuotaForm((prev) => ({
                  ...prev,
                  quotaType: e.target.value
                }))
              }
            >
              {Object.entries(quotaTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Label">
            <Input
              value={quotaForm.label}
              onChange={(e) =>
                setQuotaForm((prev) => ({ ...prev, label: e.target.value }))
              }
              placeholder="Government SME booth quota"
            />
          </Field>
          <Field label="Total quantity">
            <Input
              type="number"
              min={1}
              value={quotaForm.totalQuantity}
              onChange={(e) =>
                setQuotaForm((prev) => ({
                  ...prev,
                  totalQuantity: e.target.value
                }))
              }
            />
          </Field>
        </div>
      )
    }

    if (dialogMode === "member") {
      return (
        <div className="grid gap-3">
          <Field label="Enterprise name">
            <Input
              value={memberForm.enterpriseName}
              onChange={(e) =>
                setMemberForm((prev) => ({
                  ...prev,
                  enterpriseName: e.target.value
                }))
              }
              placeholder="Vietnam Textile Export Co."
            />
          </Field>
          <Field label="Contact email">
            <Input
              value={memberForm.contactEmail}
              onChange={(e) =>
                setMemberForm((prev) => ({
                  ...prev,
                  contactEmail: e.target.value
                }))
              }
              placeholder="ops@example.com"
            />
          </Field>
        </div>
      )
    }

    if (dialogMode === "campaign") {
      return (
        <div className="grid gap-3">
          <Field label="Campaign name">
            <Input
              value={campaignForm.name}
              onChange={(e) =>
                setCampaignForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="ISC SME Expo 2026"
            />
          </Field>
          <Field label="Invite code">
            <Input
              value={campaignForm.inviteCode}
              onChange={(e) =>
                setCampaignForm((prev) => ({
                  ...prev,
                  inviteCode: e.target.value.toUpperCase()
                }))
              }
              placeholder="ISC2026"
            />
          </Field>
          <Field label="Quota">
            <NativeSelect
              value={campaignForm.quotaId}
              onChange={(e) =>
                setCampaignForm((prev) => ({
                  ...prev,
                  quotaId: e.target.value
                }))
              }
            >
              <option value="">No quota deduction</option>
              {workspace.quotas.map((quota) => (
                <option key={quota.id} value={quota.id}>
                  {quota.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      )
    }

    if (dialogMode === "allocate-quota") {
      return (
        <div className="grid gap-3">
          <Field label="Action">
            <NativeSelect
              value={quotaActionForm.action}
              onChange={(e) =>
                setQuotaActionForm((prev) => ({
                  ...prev,
                  action: e.target.value
                }))
              }
            >
              <option value="allocate">Allocate available quota</option>
              <option value="consume">Consume allocated quota</option>
            </NativeSelect>
          </Field>
          <Field label="Quota">
            <NativeSelect
              value={quotaActionForm.quotaId}
              onChange={(e) =>
                setQuotaActionForm((prev) => ({
                  ...prev,
                  quotaId: e.target.value
                }))
              }
            >
              <option value="">Select quota</option>
              {workspace.quotas.map((quota) => (
                <option key={quota.id} value={quota.id}>
                  {quota.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Enterprise">
            <NativeSelect
              value={quotaActionForm.enterpriseMemberId}
              onChange={(e) =>
                setQuotaActionForm((prev) => ({
                  ...prev,
                  enterpriseMemberId: e.target.value
                }))
              }
            >
              <option value="">Select enterprise</option>
              {workspace.enterpriseMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.enterpriseName}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Quantity">
            <Input
              type="number"
              min={1}
              value={quotaActionForm.quantity}
              onChange={(e) =>
                setQuotaActionForm((prev) => ({
                  ...prev,
                  quantity: e.target.value
                }))
              }
            />
          </Field>
        </div>
      )
    }

    if (dialogMode === "claim-code") {
      return (
        <div className="grid gap-3">
          <Field label="Campaign">
            <NativeSelect
              value={claimForm.campaignId}
              onChange={(e) =>
                setClaimForm((prev) => ({
                  ...prev,
                  campaignId: e.target.value
                }))
              }
            >
              {workspace.inviteCampaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Enterprise">
            <NativeSelect
              value={claimForm.enterpriseMemberId}
              onChange={(e) =>
                setClaimForm((prev) => ({
                  ...prev,
                  enterpriseMemberId: e.target.value
                }))
              }
            >
              <option value="">No enterprise update</option>
              {workspace.enterpriseMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.enterpriseName}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      )
    }

    return null
  }
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

function QuotaTable({ quotas }: { quotas: PartnerQuota[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booth Quota Management</CardTitle>
        <CardDescription>
          Available, allocated, and consumed quota across partner programs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {quotas.length === 0 ? (
          <EmptyState label="No quota records yet." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quota</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Consumed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotas.map((quota) => {
                const used = quota.allocatedQuantity + quota.consumedQuantity
                const progress =
                  quota.totalQuantity > 0
                    ? Math.round((used / quota.totalQuantity) * 100)
                    : 0
                return (
                  <TableRow key={quota.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{quota.label}</p>
                        <Progress value={progress} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {quotaTypeLabels[quota.quotaType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {numberFormat.format(quota.availableQuantity)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {numberFormat.format(quota.allocatedQuantity)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {numberFormat.format(quota.consumedQuantity)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function CampaignTable({
  campaigns,
  onClaim
}: {
  campaigns: PartnerInviteCampaign[]
  onClaim?: (campaign: PartnerInviteCampaign) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Code Engine</CardTitle>
        <CardDescription>
          Active codes deduct linked quota when claimed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <EmptyState label="No invite campaigns yet." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">Claims</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {campaign.quotaLabel ?? "No quota linked"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge>{campaign.inviteCode}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFormat.format(campaign.claimedCount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={campaign.status !== "active" || !onClaim}
                      onClick={() => onClaim?.(campaign)}
                    >
                      Claim
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function EnterpriseTable({ members }: { members: PartnerEnterpriseMember[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enterprise Allocation</CardTitle>
        <CardDescription>
          Enterprises receiving quota and invite-code support.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <EmptyState label="No enterprise members yet." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enterprise</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Expo</TableHead>
                <TableHead className="text-right">RFQ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <p className="font-medium">{member.enterpriseName}</p>
                    <p className="text-muted-foreground text-xs">
                      {member.contactEmail ?? "No contact email"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {member.activationStatus.replaceAll("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFormat.format(member.expoParticipationCount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFormat.format(member.rfqGeneratedCount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
      {label}
    </div>
  )
}

function getDialogTitle(mode: DialogMode) {
  switch (mode) {
    case "quota":
      return "Add Quota"
    case "member":
      return "Add Enterprise"
    case "campaign":
      return "Create Invite Code"
    case "allocate-quota":
      return "Allocate Or Consume Quota"
    case "claim-code":
      return "Record Invite Code Claim"
    default:
      return "Partner Operation"
  }
}
