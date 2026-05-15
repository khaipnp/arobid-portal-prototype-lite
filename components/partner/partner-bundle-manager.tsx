"use client"

import type { PartnerAccess } from "@/lib/partner/access"

import {
  ArchiveIcon,
  BoxesIcon,
  CircleDollarSignIcon,
  PencilIcon,
  PlusIcon,
  ReceiptTextIcon,
  SendIcon
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type {
  PartnerBundlesWorkspace,
  PartnerServiceBundle
} from "@/lib/partner/db"

const numberFormat = new Intl.NumberFormat("en")
const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1
})

type FormMode = "add" | "edit" | null

const emptyForm = {
  name: "",
  description: "",
  partnerServicePrice: "0",
  arobidServicePrice: "0",
  discountAmount: "0",
  partnerSharePercent: "50"
}

export function PartnerBundleManager({
  access,
  workspace
}: {
  access: PartnerAccess
  workspace: PartnerBundlesWorkspace
}) {
  const router = useRouter()
  const canManageBundles = access.actions["bundle.manage"]
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const preview = useMemo(() => {
    const partnerServicePrice = Number(form.partnerServicePrice) || 0
    const arobidServicePrice = Number(form.arobidServicePrice) || 0
    const discountAmount = Number(form.discountAmount) || 0
    const totalPrice = Math.max(
      partnerServicePrice + arobidServicePrice - discountAmount,
      0
    )
    const partnerSharePercent = Math.min(
      Math.max(Number(form.partnerSharePercent) || 0, 0),
      100
    )
    const partnerShareAmount = Math.round(
      (totalPrice * partnerSharePercent) / 100
    )
    return {
      totalPrice,
      partnerShareAmount,
      arobidShareAmount: Math.max(totalPrice - partnerShareAmount, 0)
    }
  }, [form])

  function openAdd() {
    setError(null)
    setEditingId(null)
    setForm(emptyForm)
    setFormMode("add")
  }

  function openEdit(bundle: PartnerServiceBundle) {
    setError(null)
    setEditingId(bundle.id)
    setForm({
      name: bundle.name,
      description: bundle.description,
      partnerServicePrice: String(bundle.partnerServicePrice),
      arobidServicePrice: String(bundle.arobidServicePrice),
      discountAmount: String(bundle.discountAmount),
      partnerSharePercent: String(bundle.partnerSharePercent)
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

  async function saveBundle() {
    const body = {
      name: form.name,
      description: form.description,
      partnerServicePrice: Number(form.partnerServicePrice),
      arobidServicePrice: Number(form.arobidServicePrice),
      discountAmount: Number(form.discountAmount),
      partnerSharePercent: Number(form.partnerSharePercent)
    }
    if (formMode === "add") {
      await submitJson("/api/partner/bundles", "POST", body)
    } else if (formMode === "edit" && editingId) {
      await submitJson(`/api/partner/bundles/${editingId}`, "PATCH", body)
    }
  }

  async function setBundleStatus(
    bundle: PartnerServiceBundle,
    status: PartnerServiceBundle["status"]
  ) {
    await submitJson(`/api/partner/bundles/${bundle.id}/status`, "POST", {
      status
    })
  }

  async function recordPurchase(bundle: PartnerServiceBundle) {
    await submitJson(`/api/partner/bundles/${bundle.id}/purchase`, "POST")
  }

  return (
    <div className="space-y-4 px-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Published"
          value={numberFormat.format(workspace.totals.published)}
          note="Bundles visible for enterprise purchase"
          icon={<SendIcon />}
        />
        <MetricCard
          title="Draft"
          value={numberFormat.format(workspace.totals.draft)}
          note="Bundles still being configured"
          icon={<BoxesIcon />}
        />
        <MetricCard
          title="Bundle Revenue"
          value={currencyFormat.format(workspace.totals.grossRevenue)}
          note={`${currencyFormat.format(workspace.totals.partnerRevenue)} partner share`}
          icon={<CircleDollarSignIcon />}
        />
        <MetricCard
          title="Archived"
          value={numberFormat.format(workspace.totals.archived)}
          note="Retired bundle definitions"
          icon={<ArchiveIcon />}
        />
      </section>

      {message ? (
        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Bundle Catalog</CardTitle>
                <CardDescription>
                  Partner service + Arobid service - discount.
                </CardDescription>
              </div>
              {canManageBundles ? (
                <Button size="sm" onClick={openAdd}>
                  <PlusIcon />
                  Create bundle
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {workspace.bundles.length === 0 ? (
              <EmptyState label="No service bundles yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bundle</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspace.bundles.map((bundle) => (
                    <TableRow key={bundle.id}>
                      <TableCell>
                        <p className="font-medium">{bundle.name}</p>
                        <p className="line-clamp-1 text-muted-foreground text-xs">
                          {bundle.description || "No description"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">
                          {currencyFormat.format(bundle.totalPrice)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Discount{" "}
                          {currencyFormat.format(bundle.discountAmount)}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-medium text-sm">
                          {bundle.partnerSharePercent}%
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {currencyFormat.format(bundle.partnerShareAmount)}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{bundle.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {canManageBundles ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(bundle)}
                            >
                              <PencilIcon />
                              Edit
                            </Button>
                            {bundle.status !== "published" ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  setBundleStatus(bundle, "published")
                                }
                              >
                                Publish
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => recordPurchase(bundle)}
                              >
                                <ReceiptTextIcon />
                                Purchase
                              </Button>
                            )}
                            {bundle.status !== "archived" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setBundleStatus(bundle, "archived")
                                }
                              >
                                Archive
                              </Button>
                            ) : null}
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

        <Card>
          <CardHeader>
            <CardTitle>Revenue Events</CardTitle>
            <CardDescription>
              Bundle purchases feed Finance & Settlement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workspace.revenueEvents.length === 0 ? (
              <EmptyState label="No bundle purchases recorded yet." />
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
                          {event.status}
                        </p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {currencyFormat.format(event.grossAmount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {currencyFormat.format(event.partnerAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog
        open={formMode !== null}
        onOpenChange={(v) => !v && setFormMode(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {formMode === "edit" ? "Edit Bundle" : "Create Bundle"}
            </DialogTitle>
            <DialogDescription>
              Define pricing and revenue share for partner x Arobid bundle.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Bundle name">
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Export Readiness Bundle"
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value
                  }))
                }
                placeholder="Partner consulting plus Arobid market data support."
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Partner service">
                <Input
                  type="number"
                  min={0}
                  value={form.partnerServicePrice}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      partnerServicePrice: event.target.value
                    }))
                  }
                />
              </Field>
              <Field label="Arobid service">
                <Input
                  type="number"
                  min={0}
                  value={form.arobidServicePrice}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      arobidServicePrice: event.target.value
                    }))
                  }
                />
              </Field>
              <Field label="Discount">
                <Input
                  type="number"
                  min={0}
                  value={form.discountAmount}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      discountAmount: event.target.value
                    }))
                  }
                />
              </Field>
            </div>
            <Field label="Partner share percent">
              <Input
                type="number"
                min={0}
                max={100}
                value={form.partnerSharePercent}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    partnerSharePercent: event.target.value
                  }))
                }
              />
            </Field>
            <div className="grid gap-2 rounded-md border bg-muted/40 p-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-xs">Bundle price</p>
                <p className="font-semibold">
                  {currencyFormat.format(preview.totalPrice)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Partner share</p>
                <p className="font-semibold">
                  {currencyFormat.format(preview.partnerShareAmount)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Arobid share</p>
                <p className="font-semibold">
                  {currencyFormat.format(preview.arobidShareAmount)}
                </p>
              </div>
            </div>
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormMode(null)}>
              Cancel
            </Button>
            <Button disabled={isSaving} onClick={saveBundle}>
              {isSaving ? "Saving..." : "Save"}
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
      {label}
    </div>
  )
}
