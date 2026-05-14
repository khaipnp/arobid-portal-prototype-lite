"use client"

import {
  AlertTriangleIcon,
  BoxesIcon,
  CalendarClockIcon,
  CircleDollarSignIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  Trash2Icon
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
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
  PackageDefinition,
  PackageDefinitionInput,
  PackageDefinitionWorkspace,
  PackagePlanInput,
  PackagePlanValidityType
} from "@/lib/plan-subscriptions/db"

type FormMode = "add" | "edit" | null

type PackagePlanForm = {
  key: string
  planId: string
  roleCode: string
  validityType: PackagePlanValidityType
  durationMonths: string
  expoId: string
}

type PackageForm = {
  code: string
  name: string
  description: string
  price: string
  priceUnit: string
  imageUrl: string
  isPublic: boolean
  isActive: boolean
  plans: PackagePlanForm[]
}

const emptyPlan = (): PackagePlanForm => ({
  key: crypto.randomUUID(),
  planId: "",
  roleCode: "",
  validityType: "DURATION",
  durationMonths: "12",
  expoId: ""
})

const emptyForm = (): PackageForm => ({
  code: "",
  name: "",
  description: "",
  price: "0",
  priceUnit: "VND",
  imageUrl: "",
  isPublic: false,
  isActive: true,
  plans: [emptyPlan()]
})

export function PackageDefinitionManager({
  initialWorkspace
}: {
  initialWorkspace: PackageDefinitionWorkspace
}) {
  const router = useRouter()
  const [workspace, setWorkspace] = useState(initialWorkspace)
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PackageForm>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function openAdd() {
    setError(null)
    setEditingId(null)
    setForm(emptyForm())
    setFormMode("add")
  }

  function openEdit(pkg: PackageDefinition) {
    setError(null)
    setEditingId(pkg.id)
    setForm({
      code: pkg.code,
      name: pkg.name,
      description: pkg.description,
      price: String(pkg.price),
      priceUnit: pkg.priceUnit,
      imageUrl: pkg.imageUrl,
      isPublic: pkg.isPublic,
      isActive: pkg.isActive,
      plans: pkg.plans.map((plan) => ({
        key: plan.id,
        planId: plan.planId,
        roleCode: plan.roleCode,
        validityType: plan.validityType,
        durationMonths: plan.durationMonths ? String(plan.durationMonths) : "",
        expoId: plan.expoId ?? ""
      }))
    })
    setFormMode("edit")
  }

  function updatePlan(key: string, patch: Partial<PackagePlanForm>) {
    setForm((current) => ({
      ...current,
      plans: current.plans.map((plan) =>
        plan.key === key ? { ...plan, ...patch } : plan
      )
    }))
  }

  function addPlan() {
    setForm((current) => ({
      ...current,
      plans: [...current.plans, emptyPlan()]
    }))
  }

  function removePlan(key: string) {
    setForm((current) => ({
      ...current,
      plans: current.plans.filter((plan) => plan.key !== key)
    }))
  }

  function buildPayload(): PackageDefinitionInput {
    return {
      code: form.code,
      name: form.name,
      description: form.description,
      price: Number(form.price),
      priceUnit: form.priceUnit,
      imageUrl: form.imageUrl,
      isPublic: form.isPublic,
      isActive: form.isActive,
      plans: form.plans.map(
        (plan): PackagePlanInput => ({
          planId: plan.planId,
          roleCode: plan.roleCode,
          validityType: plan.validityType,
          durationMonths:
            plan.validityType === "DURATION"
              ? Number(plan.durationMonths)
              : null,
          expoId: plan.validityType === "EVENT_BOUND" ? plan.expoId : null
        })
      )
    }
  }

  async function submitJson(
    url: string,
    method: "POST" | "PATCH",
    body: unknown
  ) {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      const payload = (await response.json().catch(() => null)) as
        | (PackageDefinitionWorkspace & { error?: string })
        | null
      if (!response.ok) {
        throw new Error(payload?.error ?? "Request failed.")
      }
      if (payload) setWorkspace(payload)
      setMessage("Saved.")
      setFormMode(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.")
    } finally {
      setIsSaving(false)
    }
  }

  async function savePackage() {
    const payload = buildPayload()
    if (formMode === "add") {
      await submitJson("/api/plan-subscriptions/packages", "POST", payload)
    } else if (formMode === "edit" && editingId) {
      await submitJson(
        `/api/plan-subscriptions/packages/${editingId}`,
        "PATCH",
        payload
      )
    }
  }

  async function setPackageStatus(pkg: PackageDefinition, isActive: boolean) {
    await submitJson(
      `/api/plan-subscriptions/packages/${pkg.id}/status`,
      "POST",
      { isActive }
    )
  }

  return (
    <div className="space-y-4 px-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active"
          value={workspace.totals.active}
          note="Available for future purchase flows"
          icon={<PowerIcon />}
        />
        <MetricCard
          title="Inactive"
          value={workspace.totals.inactive}
          note="Hidden from purchase flows"
          icon={<BoxesIcon />}
        />
        <MetricCard
          title="Package plans"
          value={workspace.totals.packagePlans}
          note="Plan-role entries across packages"
          icon={<CircleDollarSignIcon />}
        />
        <MetricCard
          title="Event-bound"
          value={workspace.totals.eventBound}
          note="Plans tied to specific expos"
          icon={<CalendarClockIcon />}
        />
      </section>

      {message ? (
        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
          {message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Package Catalog</CardTitle>
              <CardDescription>
                Commercial bundles with plan validity and role assignments.
              </CardDescription>
            </div>
            <Button size="sm" onClick={openAdd}>
              <PlusIcon />
              Create package
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workspace.packages.length === 0 ? (
            <EmptyState label="No packages defined yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Plans</TableHead>
                  <TableHead>Warnings</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspace.packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <p className="font-medium">{pkg.name}</p>
                      <p className="font-mono text-muted-foreground text-xs">
                        {pkg.code}
                      </p>
                      <p className="line-clamp-1 text-muted-foreground text-xs">
                        {pkg.description || "No description"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-sm tabular-nums">
                        {formatPrice(pkg.price, pkg.priceUnit)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {pkg.isPublic ? "Public catalog" : "Internal only"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {pkg.plans.map((plan) => (
                          <div key={plan.id}>
                            <p className="font-medium text-sm">
                              {plan.planName} → {plan.roleName}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {formatValidity(plan)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {pkg.warnings.length === 0 ? (
                        <span className="text-muted-foreground text-sm">
                          None
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {pkg.warnings.map((warning) => (
                            <p
                              className="flex items-center gap-1 text-amber-600 text-xs"
                              key={warning}
                            >
                              <AlertTriangleIcon className="size-3" />
                              {warning}
                            </p>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={pkg.isActive ? "default" : "outline"}>
                        {pkg.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(pkg)}
                        >
                          <PencilIcon />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPackageStatus(pkg, !pkg.isActive)}
                        >
                          {pkg.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={formMode !== null}
        onOpenChange={(v) => !v && setFormMode(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === "edit" ? "Edit Package" : "Create Package"}
            </DialogTitle>
            <DialogDescription>
              Combine organization and expo plans with independent validity
              rules.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Package code">
                <Input
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      code: event.target.value
                    }))
                  }
                  placeholder="pkg_b2b_pro_annual"
                />
              </Field>
              <Field label="Package name">
                <Input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value
                    }))
                  }
                  placeholder="Business Pro Annual"
                />
              </Field>
            </div>
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
                placeholder="Marketing description shown to users and sales."
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
              <Field label="Price">
                <Input
                  min={0}
                  type="number"
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      price: event.target.value
                    }))
                  }
                />
              </Field>
              <Field label="Currency">
                <Input
                  value={form.priceUnit}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      priceUnit: event.target.value
                    }))
                  }
                  placeholder="VND"
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <Field label="Image URL">
                <Input
                  value={form.imageUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      imageUrl: event.target.value
                    }))
                  }
                  placeholder="/default/image/package.jpeg"
                />
              </Field>
              <Field label="Catalog visibility">
                <Select
                  value={form.isPublic ? "public" : "internal"}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      isPublic: value === "public"
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal only</SelectItem>
                    <SelectItem value="public">Public catalog</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-sm">Included plans</h3>
                  <p className="text-muted-foreground text-xs">
                    Each plan has its own role and validity configuration.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={addPlan}>
                  <PlusIcon />
                  Add plan
                </Button>
              </div>

              {form.plans.map((plan, index) => (
                <PackagePlanRow
                  key={plan.key}
                  plan={plan}
                  index={index}
                  workspace={workspace}
                  canRemove={form.plans.length > 1}
                  onChange={(patch) => updatePlan(plan.key, patch)}
                  onRemove={() => removePlan(plan.key)}
                />
              ))}
            </div>
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormMode(null)}>
              Cancel
            </Button>
            <Button disabled={isSaving} onClick={savePackage}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PackagePlanRow({
  plan,
  index,
  workspace,
  canRemove,
  onChange,
  onRemove
}: {
  plan: PackagePlanForm
  index: number
  workspace: PackageDefinitionWorkspace
  canRemove: boolean
  onChange: (patch: Partial<PackagePlanForm>) => void
  onRemove: () => void
}) {
  const selectedPlan = workspace.plans.find((item) => item.id === plan.planId)
  const validityOptions =
    selectedPlan?.targetType === "EXPO" ? ["EVENT_BOUND"] : ["DURATION"]

  return (
    <div className="grid gap-3 rounded-md border bg-muted/30 p-3 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
      <Field label={`Plan #${index + 1}`}>
        <Select
          value={plan.planId}
          onValueChange={(value) => {
            const nextPlan = workspace.plans.find((item) => item.id === value)
            onChange({
              planId: value,
              validityType:
                nextPlan?.targetType === "EXPO" ? "EVENT_BOUND" : "DURATION",
              durationMonths:
                nextPlan?.targetType === "EXPO"
                  ? ""
                  : plan.durationMonths || "12",
              expoId: nextPlan?.targetType === "EXPO" ? plan.expoId : ""
            })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select plan" />
          </SelectTrigger>
          <SelectContent>
            {workspace.plans.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} ({item.targetType})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Role">
        <Select
          value={plan.roleCode}
          onValueChange={(value) => onChange({ roleCode: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {workspace.roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Validity">
        <Select
          value={plan.validityType}
          onValueChange={(value) =>
            onChange({ validityType: value as PackagePlanValidityType })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {validityOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {plan.validityType === "DURATION" ? (
        <Field label="Months">
          <Input
            min={1}
            type="number"
            value={plan.durationMonths}
            onChange={(event) =>
              onChange({ durationMonths: event.target.value })
            }
          />
        </Field>
      ) : (
        <Field label="Expo">
          <Select
            value={plan.expoId}
            onValueChange={(value) => onChange({ expoId: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select expo" />
            </SelectTrigger>
            <SelectContent>
              {workspace.expos.map((expo) => (
                <SelectItem key={expo.id} value={expo.id}>
                  {expo.name} ({expo.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
      <div className="flex items-end justify-end">
        <Button
          disabled={!canRemove}
          size="icon"
          variant="outline"
          onClick={onRemove}
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  )
}

function formatValidity(plan: PackageDefinition["plans"][number]) {
  if (plan.validityType === "DURATION") {
    return `${plan.durationMonths} months · ${plan.planTargetType}`
  }
  return `${plan.expoName ?? "Expo"} · event-bound`
}

function formatPrice(price: number, priceUnit: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: priceUnit,
    maximumFractionDigits: 0
  }).format(price)
}

function MetricCard({
  title,
  value,
  note,
  icon
}: {
  title: string
  value: number
  note: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="font-semibold text-2xl tabular-nums">{value}</p>
          <p className="text-muted-foreground text-xs">{note}</p>
        </div>
        <div className="rounded-full bg-muted p-3 text-muted-foreground [&_svg]:size-5">
          {icon}
        </div>
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
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
      {label}
    </div>
  )
}
