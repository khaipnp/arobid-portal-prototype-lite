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
import type { HallTemplate } from "@/lib/tradexpo/types"
import type { HallFormRow } from "./types"

type HallsStepProps = {
  halls: HallFormRow[]
  hallTemplates: HallTemplate[]
  onAddHall: () => void
  onRemoveHall: (index: number) => void
  onUpdateHall: (index: number, patch: Partial<HallFormRow>) => void
}

export function HallsStep({
  halls,
  hallTemplates,
  onAddHall,
  onRemoveHall,
  onUpdateHall
}: HallsStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-row items-start justify-between gap-2">
        <div className="space-y-1">
          <h2 className="font-semibold text-xl leading-none">
            Hall configuration
          </h2>
          <p className="text-muted-foreground text-sm">
            One or more halls: name, hall template, and booth tier counts (Basic
            / Professional / Premium).
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAddHall}>
          <PlusIcon />
          Add hall
        </Button>
      </div>
      <div className="space-y-6">
        {halls.map((hall, index) => (
          <div key={hall.key} className="space-y-3 rounded-3xl border p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-base">Hall {index + 1}</span>
              {halls.length > 1 ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  onClick={() => onRemoveHall(index)}
                  aria-label="Remove hall"
                >
                  <Trash2Icon />
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Hall name</Label>
                <Input
                  className="w-full"
                  value={hall.hallName}
                  onChange={(e) =>
                    onUpdateHall(index, { hallName: e.target.value })
                  }
                  maxLength={100}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Hall template</Label>
                <Select
                  value={hall.hallTemplateId || undefined}
                  onValueChange={(v) =>
                    onUpdateHall(index, { hallTemplateId: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select hall template" />
                  </SelectTrigger>
                  <SelectContent>
                    {hallTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hall.hallTemplateId ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <BoothQuantityField
                  label="Basic"
                  value={hall.basicQty}
                  onChange={(basicQty) => onUpdateHall(index, { basicQty })}
                />
                <BoothQuantityField
                  label="Professional"
                  value={hall.professionalQty}
                  onChange={(professionalQty) =>
                    onUpdateHall(index, { professionalQty })
                  }
                />
                <BoothQuantityField
                  label="Premium"
                  value={hall.premiumQty}
                  onChange={(premiumQty) => onUpdateHall(index, { premiumQty })}
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                Select a hall template to set booth tier quantities.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

type BoothQuantityFieldProps = {
  label: string
  value: number
  onChange: (value: number) => void
}

function BoothQuantityField({
  label,
  value,
  onChange
}: BoothQuantityFieldProps) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10) || 0)}
      />
    </div>
  )
}
