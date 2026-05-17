"use client"

import {
  AlertTriangleIcon,
  EyeIcon,
  LayersIcon,
  PencilIcon,
  PowerIcon
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  buildPackagePayload,
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
import type { PackageDefinitionDetailWorkspace } from "@/lib/plan-subscriptions/db"

export function PackageDefinitionDetailManager({
  initialWorkspace
}: {
  initialWorkspace: PackageDefinitionDetailWorkspace
}) {
  const router = useRouter()
  const [workspace, setWorkspace] = useState(initialWorkspace)
  const [form, setForm] = useState<PackageForm>(() =>
    packageToForm(initialWorkspace.package)
  )
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const pkg = workspace.package

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
        | (PackageDefinitionDetailWorkspace & { error?: string })
        | null
      if (!response.ok) {
        throw new Error(payload?.error ?? "Request failed.")
      }
      if (payload) {
        setWorkspace(payload)
        setForm(packageToForm(payload.package))
      }
      setMessage("Saved.")
      setIsEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.")
    } finally {
      setIsSaving(false)
    }
  }

  async function savePackage() {
    await submitJson(
      `/api/plan-subscriptions/packages/${pkg.id}`,
      "PATCH",
      buildPackagePayload(form)
    )
  }

  async function setPackageStatus(isActive: boolean) {
    await submitJson(
      `/api/plan-subscriptions/packages/${pkg.id}/status`,
      "POST",
      { isActive }
    )
  }

  function openEdit() {
    setError(null)
    setForm(packageToForm(pkg))
    setIsEditing(true)
  }

  return (
    <div className="space-y-4 px-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PackageStatCard
          title="Status"
          value={pkg.isActive ? "Active" : "Inactive"}
          note="Availability for purchase flows"
          icon={<PowerIcon />}
        />
        <PackageStatCard
          title="Visibility"
          value={pkg.isPublic ? "Public" : "Internal"}
          note="Catalog exposure"
          icon={<EyeIcon />}
        />
        <PackageStatCard
          title="Included plans"
          value={workspace.totals.packagePlans}
          note={`${workspace.totals.eventBound} event-bound`}
          icon={<LayersIcon />}
        />
        <PackageStatCard
          title="Warnings"
          value={workspace.totals.warnings}
          note="Inactive plans or expos"
          icon={<AlertTriangleIcon />}
        />
      </section>

      {message ? (
        <div className="rounded-md border bg-muted px-3 py-2 text-sm">
          {message}
        </div>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{pkg.name}</CardTitle>
              <CardDescription className="font-mono">
                {pkg.code}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={openEdit}>
                <PencilIcon />
                Edit
              </Button>
              <Button
                disabled={isSaving}
                size="sm"
                variant="outline"
                onClick={() => setPackageStatus(!pkg.isActive)}
              >
                {pkg.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-3">
              <InfoRow
                label="Description"
                value={pkg.description || "No description"}
              />
              <InfoRow
                label="Image URL"
                value={pkg.imageUrl || "Not configured"}
              />
              <InfoRow
                label="Created"
                value={new Date(pkg.createdAt).toLocaleString()}
              />
              <InfoRow
                label="Updated"
                value={new Date(pkg.updatedAt).toLocaleString()}
              />
            </div>
            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <p className="text-muted-foreground text-sm">Price</p>
                <p className="font-semibold text-2xl tabular-nums">
                  {formatPrice(pkg.price, pkg.priceUnit)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={pkg.isActive ? "default" : "outline"}>
                  {pkg.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant={pkg.isPublic ? "default" : "secondary"}>
                  {pkg.isPublic ? "Public catalog" : "Internal only"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Included plans</CardTitle>
          <CardDescription>
            Plan, role, target type, and validity rules in this package.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pkg.plans.length === 0 ? (
            <EmptyState label="No plans included." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pkg.plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <p className="font-medium">{plan.planName}</p>
                      <p className="font-mono text-muted-foreground text-xs">
                        {plan.planCode}
                      </p>
                    </TableCell>
                    <TableCell>{plan.roleName}</TableCell>
                    <TableCell>{plan.planTargetType}</TableCell>
                    <TableCell>{formatValidity(plan)}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={plan.planIsActive ? "default" : "outline"}
                      >
                        {plan.planIsActive ? "Active" : "Inactive"}
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
          <CardTitle>Warnings</CardTitle>
          <CardDescription>
            Issues that may affect package purchase or fulfillment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pkg.warnings.length === 0 ? (
            <EmptyState label="No warnings." />
          ) : (
            <div className="grid gap-2">
              {pkg.warnings.map((warning) => (
                <div
                  className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 text-sm dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                  key={warning}
                >
                  <AlertTriangleIcon className="size-4" />
                  {warning}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Package</DialogTitle>
            <DialogDescription>
              Update commercial details and included plan validity rules.
            </DialogDescription>
          </DialogHeader>
          <PackageDefinitionFormFields
            form={form}
            workspace={workspace}
            onChange={setForm}
          />
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="break-words text-sm">{value}</p>
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
