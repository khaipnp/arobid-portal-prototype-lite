"use client"

import {
  AlertTriangleIcon,
  BoxesIcon,
  CalendarClockIcon,
  CircleDollarSignIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  buildPackagePayload,
  emptyForm,
  type FormMode,
  formatPrice,
  formatValidity,
  PackageDefinitionFormFields,
  type PackageForm,
  packageToForm
} from "@/components/plan-subscriptions/package-definition-form"
import { PackageStatCard } from "@/components/plan-subscriptions/package-stat-card"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type {
  PackageDefinition,
  PackageDefinitionWorkspace
} from "@/lib/plan-subscriptions/db"

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
    setForm(packageToForm(pkg))
    setFormMode("edit")
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
    const payload = buildPackagePayload(form)
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
    <div className="mt-6 space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PackageStatCard
          title="Active"
          value={workspace.totals.active}
          note="Available for future purchase flows"
          icon={<PowerIcon />}
        />
        <PackageStatCard
          title="Inactive"
          value={workspace.totals.inactive}
          note="Hidden from purchase flows"
          icon={<BoxesIcon />}
        />
        <PackageStatCard
          title="Package plans"
          value={workspace.totals.packagePlans}
          note="Plan-role entries across packages"
          icon={<CircleDollarSignIcon />}
        />
        <PackageStatCard
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

      {workspace.packages.length === 0 ? (
        <EmptyState label="No packages defined yet." />
      ) : (
        <div className="overflow-hidden rounded-2xl border">
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
                    <Link
                      className="font-medium hover:underline"
                      href={`/admin/plan-subscriptions/packages/${pkg.id}`}
                    >
                      {pkg.name}
                    </Link>
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
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/admin/plan-subscriptions/packages/${pkg.id}`}
                        >
                          <EyeIcon />
                          View
                        </Link>
                      </Button>
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
        </div>
      )}

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
          <PackageDefinitionFormFields
            form={form}
            workspace={workspace}
            onChange={setForm}
          />
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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
      {label}
    </div>
  )
}
