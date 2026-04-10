"use client"

import { ChevronsUpDownIcon } from "lucide-react"
import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  mockHallSlotUsage,
  mockHallTemplateSlots,
  mockHallTemplates,
} from "@/lib/tradexpo/mock-data"
import type { HallSlotUsage, HallTemplateSlot } from "@/lib/tradexpo/types"
import {
  createMockId,
  parseMetadataInput,
  serializeMetadata,
} from "@/lib/tradexpo/utils"

interface SlotFormState {
  slotCode: string
  name: string
  posX: string
  posY: string
  posZ: string
  rotX: string
  rotY: string
  rotZ: string
  scaleX: string
  scaleY: string
  scaleZ: string
  width: string
  height: string
  depth: string
  metadataInput: string
}

const defaultSlotForm: SlotFormState = {
  slotCode: "",
  name: "",
  posX: "0",
  posY: "0",
  posZ: "0",
  rotX: "0",
  rotY: "0",
  rotZ: "0",
  scaleX: "1",
  scaleY: "1",
  scaleZ: "1",
  width: "0",
  height: "0",
  depth: "0",
  metadataInput: "",
}

function cloneSlots() {
  return mockHallTemplateSlots.map((slot) => ({
    ...slot,
    metadata: { ...slot.metadata },
  }))
}

function cloneUsage() {
  return mockHallSlotUsage.map((usage) => ({ ...usage }))
}

function fieldToNumber(value: string, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function HallSlotManager({
  templateId,
  embedded = false,
}: {
  templateId: string
  embedded?: boolean
}) {
  const hallTemplate = React.useMemo(
    () => mockHallTemplates.find((template) => template.id === templateId),
    [templateId],
  )

  const [slots, setSlots] = React.useState<HallTemplateSlot[]>(cloneSlots)
  const [slotUsage, setSlotUsage] = React.useState<HallSlotUsage[]>(cloneUsage)
  const [slotCodeSortAsc, setSlotCodeSortAsc] = React.useState(true)

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingSlotId, setEditingSlotId] = React.useState<string | null>(null)
  const [formState, setFormState] =
    React.useState<SlotFormState>(defaultSlotForm)
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

  const [notice, setNotice] = React.useState<{
    type: "success" | "error" | "info"
    text: string
  } | null>(null)

  const templateSlots = React.useMemo(() => {
    const items = slots.filter((slot) => slot.hallTemplateId === templateId)

    items.sort((left, right) => {
      const compare = left.slotCode.localeCompare(right.slotCode)
      return slotCodeSortAsc ? compare : -compare
    })

    return items
  }, [slots, templateId, slotCodeSortAsc])

  function getUsage(slotId: string) {
    return slotUsage.find((item) => item.slotId === slotId)
  }

  const resetForm = React.useCallback(() => {
    setFormState(defaultSlotForm)
    setEditingSlotId(null)
    setFormErrors({})
  }, [])

  function openCreateForm() {
    resetForm()
    setFormOpen(true)
  }

  function openEditForm(slot: HallTemplateSlot) {
    setEditingSlotId(slot.id)
    setFormState({
      slotCode: slot.slotCode,
      name: slot.name,
      posX: String(slot.posX),
      posY: String(slot.posY),
      posZ: String(slot.posZ),
      rotX: String(slot.rotX),
      rotY: String(slot.rotY),
      rotZ: String(slot.rotZ),
      scaleX: String(slot.scaleX),
      scaleY: String(slot.scaleY),
      scaleZ: String(slot.scaleZ),
      width: String(slot.width),
      height: String(slot.height),
      depth: String(slot.depth),
      metadataInput: serializeMetadata(slot.metadata),
    })
    setFormErrors({})
    setFormOpen(true)
  }

  const handleFormOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setFormOpen(nextOpen)

      if (!nextOpen) {
        resetForm()
      }
    },
    [resetForm],
  )

  function validateForm() {
    const nextErrors: Record<string, string> = {}

    const duplicate = templateSlots.some(
      (slot) =>
        slot.slotCode.toLowerCase() ===
          formState.slotCode.trim().toLowerCase() && slot.id !== editingSlotId,
    )

    if (!formState.slotCode.trim()) {
      nextErrors.slotCode = "Slot code is required"
    } else if (duplicate) {
      nextErrors.slotCode = "Slot code already exists in this hall"
    }

    if (!formState.name.trim()) {
      nextErrors.name = "Name is required"
    }

    const requiredNumericFields: Array<[string, string]> = [
      ["posX", formState.posX],
      ["posY", formState.posY],
      ["posZ", formState.posZ],
      ["rotX", formState.rotX],
      ["rotY", formState.rotY],
      ["rotZ", formState.rotZ],
      ["width", formState.width],
      ["height", formState.height],
      ["depth", formState.depth],
    ]

    for (const [fieldName, fieldValue] of requiredNumericFields) {
      if (fieldValue.trim() === "") {
        nextErrors[fieldName] = "Required"
      }
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    const targetId = editingSlotId || createMockId("slot")
    const liveUsage = editingSlotId
      ? getUsage(editingSlotId)?.liveExpoCount || 0
      : 0

    const nextSlot: HallTemplateSlot = {
      id: targetId,
      hallTemplateId: templateId,
      slotCode: formState.slotCode.trim(),
      name: formState.name.trim(),
      posX: fieldToNumber(formState.posX, 0),
      posY: fieldToNumber(formState.posY, 0),
      posZ: fieldToNumber(formState.posZ, 0),
      rotX: fieldToNumber(formState.rotX, 0),
      rotY: fieldToNumber(formState.rotY, 0),
      rotZ: fieldToNumber(formState.rotZ, 0),
      scaleX: fieldToNumber(formState.scaleX, 1),
      scaleY: fieldToNumber(formState.scaleY, 1),
      scaleZ: fieldToNumber(formState.scaleZ, 1),
      width: fieldToNumber(formState.width, 0),
      height: fieldToNumber(formState.height, 0),
      depth: fieldToNumber(formState.depth, 0),
      metadata: parseMetadataInput(formState.metadataInput),
    }

    if (editingSlotId) {
      setSlots((currentSlots) =>
        currentSlots.map((slot) =>
          slot.id === editingSlotId ? nextSlot : slot,
        ),
      )

      if (liveUsage > 0) {
        setNotice({
          type: "info",
          text: "This slot is in use by a live expo. Changes will take effect on next load.",
        })
      } else {
        setNotice({ type: "success", text: "Slot updated." })
      }
    } else {
      setSlots((currentSlots) => [...currentSlots, nextSlot])
      setSlotUsage((currentUsage) => [
        ...currentUsage,
        { slotId: nextSlot.id, upcomingExpoCount: 0, liveExpoCount: 0 },
      ])
      setNotice({ type: "success", text: "Slot created." })
    }

    setFormOpen(false)
    resetForm()
  }

  function handleDelete(slot: HallTemplateSlot) {
    const usage = getUsage(slot.id)
    const blocked =
      (usage?.upcomingExpoCount || 0) > 0 || (usage?.liveExpoCount || 0) > 0

    if (blocked) {
      setNotice({
        type: "error",
        text: "This slot is assigned to an active expo and cannot be deleted.",
      })
      return
    }

    setSlots((currentSlots) =>
      currentSlots.filter((item) => item.id !== slot.id),
    )
    setSlotUsage((currentUsage) =>
      currentUsage.filter((item) => item.slotId !== slot.id),
    )

    setNotice({ type: "success", text: "Slot removed." })
  }

  if (!hallTemplate) {
    return (
      <section className="rounded-xl border bg-card p-4">
        <p className="text-rose-600 text-sm">Hall template not found.</p>
      </section>
    )
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-base">
              {embedded ? "Slot Configuration" : hallTemplate.name}
            </h2>
            <p className="text-muted-foreground text-sm">
              {embedded
                ? "Manage booth slot coordinates, transform, and metadata for this hall template."
                : "Configure booth slot coordinates and dimensions for this hall."}
            </p>
          </div>
          <Button onClick={openCreateForm}>+ Add Slot</Button>
        </div>

        {notice ? (
          <p
            className={
              notice.type === "error"
                ? "mt-3 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-rose-700 text-sm"
                : notice.type === "info"
                  ? "mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-700 text-sm"
                  : "mt-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-700 text-sm"
            }
          >
            {notice.text}
          </p>
        ) : null}

        <div className="mt-4 rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => setSlotCodeSortAsc((value) => !value)}
                  >
                    Slot Code <ChevronsUpDownIcon size={12} />
                  </button>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Position (x,y,z)</TableHead>
                <TableHead>Rotation (x,y,z)</TableHead>
                <TableHead>Scale (x,y,z)</TableHead>
                <TableHead>Size (w,h,d)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templateSlots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-4 text-muted-foreground">
                    No slots yet.
                  </TableCell>
                </TableRow>
              ) : (
                templateSlots.map((slot) => (
                  <TableRow key={slot.id}>
                    <TableCell className="font-medium">
                      {slot.slotCode}
                    </TableCell>
                    <TableCell>{slot.name}</TableCell>
                    <TableCell>
                      {slot.posX}, {slot.posY}, {slot.posZ}
                    </TableCell>
                    <TableCell>
                      {slot.rotX}, {slot.rotY}, {slot.rotZ}
                    </TableCell>
                    <TableCell>
                      {slot.scaleX}, {slot.scaleY}, {slot.scaleZ}
                    </TableCell>
                    <TableCell>
                      {slot.width}, {slot.height}, {slot.depth}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => openEditForm(slot)}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="xs" variant="destructive">
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent size="sm">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete slot?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action permanently removes the selected
                                slot from this hall template.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => handleDelete(slot)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={formOpen} onOpenChange={handleFormOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingSlotId ? "Edit Slot" : "Add Slot"}
            </DialogTitle>
            <DialogDescription>
              Configure booth slot code, transform, size, and metadata.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-3" onSubmit={handleSave}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-1">
                <label className="font-medium text-sm">Slot Code</label>
                <Input
                  value={formState.slotCode}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      slotCode: event.target.value,
                    }))
                  }
                  placeholder="A01"
                />
                {formErrors.slotCode ? (
                  <p className="text-rose-600 text-xs">{formErrors.slotCode}</p>
                ) : null}
              </div>

              <div className="grid gap-1">
                <label className="font-medium text-sm">Name</label>
                <Input
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Booth A01"
                />
                {formErrors.name ? (
                  <p className="text-rose-600 text-xs">{formErrors.name}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <NumericField
                label="Pos X"
                value={formState.posX}
                onChange={(value) =>
                  setFormState((state) => ({ ...state, posX: value }))
                }
                error={formErrors.posX}
              />
              <NumericField
                label="Pos Y"
                value={formState.posY}
                onChange={(value) =>
                  setFormState((state) => ({ ...state, posY: value }))
                }
                error={formErrors.posY}
              />
              <NumericField
                label="Pos Z"
                value={formState.posZ}
                onChange={(value) =>
                  setFormState((state) => ({ ...state, posZ: value }))
                }
                error={formErrors.posZ}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <NumericField
                label="Rot X"
                value={formState.rotX}
                onChange={(value) =>
                  setFormState((state) => ({ ...state, rotX: value }))
                }
                error={formErrors.rotX}
              />
              <NumericField
                label="Rot Y"
                value={formState.rotY}
                onChange={(value) =>
                  setFormState((state) => ({ ...state, rotY: value }))
                }
                error={formErrors.rotY}
              />
              <NumericField
                label="Rot Z"
                value={formState.rotZ}
                onChange={(value) =>
                  setFormState((state) => ({ ...state, rotZ: value }))
                }
                error={formErrors.rotZ}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <NumericField
                label="Scale X"
                value={formState.scaleX}
                onChange={(value) =>
                  setFormState((state) => ({ ...state, scaleX: value }))
                }
                defaultHint="Defaults to 1.0"
              />
              <NumericField
                label="Scale Y"
                value={formState.scaleY}
                onChange={(value) =>
                  setFormState((state) => ({ ...state, scaleY: value }))
                }
                defaultHint="Defaults to 1.0"
              />
              <NumericField
                label="Scale Z"
                value={formState.scaleZ}
                onChange={(value) =>
                  setFormState((state) => ({ ...state, scaleZ: value }))
                }
                defaultHint="Defaults to 1.0"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <NumericField
                label="Width"
                value={formState.width}
                onChange={(value) =>
                  setFormState((state) => ({ ...state, width: value }))
                }
                error={formErrors.width}
              />
              <NumericField
                label="Height"
                value={formState.height}
                onChange={(value) =>
                  setFormState((state) => ({ ...state, height: value }))
                }
                error={formErrors.height}
              />
              <NumericField
                label="Depth"
                value={formState.depth}
                onChange={(value) =>
                  setFormState((state) => ({ ...state, depth: value }))
                }
                error={formErrors.depth}
              />
            </div>

            <div className="grid gap-1">
              <label className="font-medium text-sm">
                Metadata (key: value per line)
              </label>
              <Textarea
                value={formState.metadataInput}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    metadataInput: event.target.value,
                  }))
                }
                className="min-h-24"
                placeholder="zone: north\nlighting: warm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleFormOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Slot</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NumericField({
  label,
  value,
  onChange,
  error,
  defaultHint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  defaultHint?: string
}) {
  return (
    <div className="grid gap-1">
      <label className="font-medium text-sm">{label}</label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
      {error ? (
        <p className="text-rose-600 text-xs">{error}</p>
      ) : defaultHint ? (
        <p className="text-muted-foreground text-xs">{defaultHint}</p>
      ) : null}
    </div>
  )
}
