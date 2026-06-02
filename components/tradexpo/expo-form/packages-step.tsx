import { InfoIcon, PlusIcon, Trash2Icon } from "lucide-react"
import type * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import type { ExpoPackageFormWorkspace } from "@/lib/tradexpo/types"
import { newExpoPackageRow } from "./row-helpers"
import type { ExpoPackageFormRow } from "./types"

type PackagesStepProps = {
  packages: ExpoPackageFormRow[]
  packageWorkspace?: ExpoPackageFormWorkspace
  onPackagesChange: React.Dispatch<React.SetStateAction<ExpoPackageFormRow[]>>
  onUpdatePackage: (index: number, patch: Partial<ExpoPackageFormRow>) => void
  onUpdatePackageBenefit: (
    packageIndex: number,
    benefitIndex: number,
    value: string
  ) => void
}

const AUTO_VALUE = "__auto__"

export function PackagesStep({
  packages,
  packageWorkspace,
  onPackagesChange,
  onUpdatePackage,
  onUpdatePackageBenefit
}: PackagesStepProps) {
  const packageOptions = packageWorkspace?.packages ?? []
  const expoPlans = (packageWorkspace?.plans ?? []).filter(
    (plan) => plan.targetType === "EXPO" && plan.isActive
  )
  const roles = packageWorkspace?.roles ?? []

  function applyExistingPackage(index: number, packageId: string) {
    const selected = packageOptions.find((pkg) => pkg.id === packageId)
    if (!selected) {
      onUpdatePackage(index, { packageDefinitionId: packageId })
      return
    }
    onUpdatePackage(index, {
      packageDefinitionId: selected.id,
      name: selected.name,
      description: selected.description,
      price: String(selected.price),
      priceUnit: selected.priceUnit,
      benefits: selected.description ? [selected.description] : [""],
      isPublic: selected.isPublic
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-1">
          <h2 className="font-semibold text-xl capitalize leading-none">
            Packages management
          </h2>
          <p className="text-muted-foreground text-sm">
            Configure exhibitor packages shown on Expo Detail. Each package
            links to subscription package data for future checkout flows.
          </p>
        </div>
        <Button
          size="sm"
          disabled={packages.length >= 6}
          onClick={() =>
            onPackagesChange((prev) => [...prev, newExpoPackageRow()])
          }
        >
          Add package
        </Button>
      </div>
      <div className="space-y-3">
        {packages.map((pkg, packageIndex) => (
          <Card key={pkg.key}>
            <CardHeader>
              <CardTitle> Package {packageIndex + 1}</CardTitle>
              <CardDescription>
                Link an existing package or create a new event-bound seller
                package for this expo.
              </CardDescription>
              <CardAction>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    onPackagesChange((prev) =>
                      prev.filter((_, index) => index !== packageIndex)
                    )
                  }
                >
                  <Trash2Icon />
                </Button>
              </CardAction>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label>
                  Mode
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon size="16" className="text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Link an existing package or create a new event-bound
                      seller package for this expo.
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <RadioGroup
                  value={pkg.mode}
                  onValueChange={(value) =>
                    onUpdatePackage(packageIndex, {
                      mode: value as ExpoPackageFormRow["mode"],
                      packageDefinitionId:
                        value === "create_new"
                          ? undefined
                          : pkg.packageDefinitionId
                    })
                  }
                  className="grid gap-2 sm:grid-cols-2"
                >
                  <div className="flex items-center gap-3 rounded-md border px-4 py-3">
                    <RadioGroupItem
                      id={`${pkg.key}-mode-link-existing`}
                      value="link_existing"
                    />
                    <Label
                      htmlFor={`${pkg.key}-mode-link-existing`}
                      className="font-normal"
                    >
                      Link existing package
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 rounded-md border px-4 py-3">
                    <RadioGroupItem
                      id={`${pkg.key}-mode-create-new`}
                      value="create_new"
                    />
                    <Label
                      htmlFor={`${pkg.key}-mode-create-new`}
                      className="font-normal"
                    >
                      Create new package
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {pkg.mode === "link_existing" ? (
                <div className="grid gap-2">
                  <Label>Existing package</Label>
                  <Select
                    value={pkg.packageDefinitionId ?? undefined}
                    onValueChange={(value) =>
                      applyExistingPackage(packageIndex, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packageOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Package name</Label>
                  <Input
                    value={pkg.name}
                    onChange={(event) =>
                      onUpdatePackage(packageIndex, {
                        name: event.target.value
                      })
                    }
                    placeholder="Premium Exhibitor Package"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                  <div className="grid gap-2">
                    <Label>Price</Label>
                    <Input
                      min={0}
                      type="number"
                      value={pkg.price}
                      onChange={(event) =>
                        onUpdatePackage(packageIndex, {
                          price: event.target.value
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Currency</Label>
                    <Input
                      value={pkg.priceUnit}
                      onChange={(event) =>
                        onUpdatePackage(packageIndex, {
                          priceUnit: event.target.value
                        })
                      }
                      placeholder="VND"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={pkg.description}
                  onChange={(event) =>
                    onUpdatePackage(packageIndex, {
                      description: event.target.value
                    })
                  }
                  rows={2}
                  placeholder="Short package description shown on Expo Detail."
                />
              </div>

              <div className="space-y-2">
                <Label>Benefits</Label>
                {pkg.benefits.map((benefit, benefitIndex) => (
                  <div
                    key={`${pkg.key}-benefit-${benefit}`}
                    className="flex gap-2"
                  >
                    <Input
                      value={benefit}
                      onChange={(event) =>
                        onUpdatePackageBenefit(
                          packageIndex,
                          benefitIndex,
                          event.target.value
                        )
                      }
                      placeholder="Benefit item"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={pkg.benefits.length <= 1}
                      onClick={() =>
                        onUpdatePackage(packageIndex, {
                          benefits: pkg.benefits.filter(
                            (_, index) => index !== benefitIndex
                          )
                        })
                      }
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pkg.benefits.length >= 10}
                  onClick={() =>
                    onUpdatePackage(packageIndex, {
                      benefits: [...pkg.benefits, ""]
                    })
                  }
                >
                  <PlusIcon className="mr-1 size-4" />
                  Add benefit
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={pkg.isFeatured}
                    onCheckedChange={(value) =>
                      onUpdatePackage(packageIndex, {
                        isFeatured: Boolean(value)
                      })
                    }
                  />
                  Featured package
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={pkg.isPublic}
                    onCheckedChange={(value) =>
                      onUpdatePackage(packageIndex, {
                        isPublic: Boolean(value)
                      })
                    }
                  />
                  Show on public Expo Detail
                </label>
              </div>

              <div className="grid gap-3 rounded-md bg-muted/40 p-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Advanced EXPO plan</Label>
                  <Select
                    value={pkg.advanced.planId || AUTO_VALUE}
                    onValueChange={(value) =>
                      onUpdatePackage(packageIndex, {
                        advanced: {
                          ...pkg.advanced,
                          planId: value === AUTO_VALUE ? "" : value
                        }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auto default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AUTO_VALUE}>Auto default</SelectItem>
                      {expoPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Advanced role</Label>
                  <Select
                    value={pkg.advanced.roleCode || AUTO_VALUE}
                    onValueChange={(value) =>
                      onUpdatePackage(packageIndex, {
                        advanced: {
                          ...pkg.advanced,
                          roleCode: value === AUTO_VALUE ? "" : value
                        }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auto seller/exhibitor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AUTO_VALUE}>
                        Auto seller/exhibitor
                      </SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
