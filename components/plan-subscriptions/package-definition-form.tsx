"use client"

import { PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type {
  PackageDefinition,
  PackageDefinitionDetailWorkspace,
  PackageDefinitionInput,
  PackageDefinitionWorkspace,
  PackagePlanInput,
  PackagePlanValidityType
} from "@/lib/plan-subscriptions/db"

export type FormMode = "add" | "edit" | null

export type PackagePlanForm = {
  key: string
  planId: string
  roleCode: string
  validityType: PackagePlanValidityType
  durationMonths: string
  expoId: string
}

export type PackageForm = {
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

type PackageFormWorkspace = Pick<
  PackageDefinitionWorkspace | PackageDefinitionDetailWorkspace,
  "plans" | "roles" | "expos"
>

export const emptyPlan = (): PackagePlanForm => ({
  key: crypto.randomUUID(),
  planId: "",
  roleCode: "",
  validityType: "DURATION",
  durationMonths: "12",
  expoId: ""
})

export const emptyForm = (): PackageForm => ({
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

export function packageToForm(pkg: PackageDefinition): PackageForm {
  return {
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
  }
}

export function buildPackagePayload(form: PackageForm): PackageDefinitionInput {
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
          plan.validityType === "DURATION" ? Number(plan.durationMonths) : null,
        expoId: plan.validityType === "EVENT_BOUND" ? plan.expoId : null
      })
    )
  }
}

export function PackageDefinitionFormFields({
  form,
  workspace,
  onChange
}: {
  form: PackageForm
  workspace: PackageFormWorkspace
  onChange: (form: PackageForm) => void
}) {
  function updatePlan(key: string, patch: Partial<PackagePlanForm>) {
    onChange({
      ...form,
      plans: form.plans.map((plan) =>
        plan.key === key ? { ...plan, ...patch } : plan
      )
    })
  }

  function addPlan() {
    onChange({ ...form, plans: [...form.plans, emptyPlan()] })
  }

  function removePlan(key: string) {
    onChange({ ...form, plans: form.plans.filter((plan) => plan.key !== key) })
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Package code">
          <Input
            value={form.code}
            onChange={(event) =>
              onChange({ ...form, code: event.target.value })
            }
            placeholder="pkg_b2b_pro_annual"
          />
        </Field>
        <Field label="Package name">
          <Input
            value={form.name}
            onChange={(event) =>
              onChange({ ...form, name: event.target.value })
            }
            placeholder="Business Pro Annual"
          />
        </Field>
      </div>
      <Field label="Description">
        <Textarea
          value={form.description}
          onChange={(event) =>
            onChange({ ...form, description: event.target.value })
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
              onChange({ ...form, price: event.target.value })
            }
          />
        </Field>
        <Field label="Currency">
          <Input
            value={form.priceUnit}
            onChange={(event) =>
              onChange({ ...form, priceUnit: event.target.value })
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
              onChange({ ...form, imageUrl: event.target.value })
            }
            placeholder="/default/image/package.jpeg"
          />
        </Field>
        <Field label="Catalog visibility">
          <Select
            value={form.isPublic ? "public" : "internal"}
            onValueChange={(value) =>
              onChange({ ...form, isPublic: value === "public" })
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
  workspace: PackageFormWorkspace
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

export function formatValidity(plan: PackageDefinition["plans"][number]) {
  if (plan.validityType === "DURATION") {
    return `${plan.durationMonths} months · ${plan.planTargetType}`
  }
  return `${plan.expoName ?? "Expo"} · event-bound`
}

export function formatPrice(price: number, priceUnit: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: priceUnit,
    maximumFractionDigits: 0
  }).format(price)
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
