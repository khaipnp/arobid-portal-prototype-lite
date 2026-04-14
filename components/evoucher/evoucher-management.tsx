"use client"

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FilterXIcon,
  PencilIcon,
  PlusIcon,
  ShieldOffIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  mockVoucherBatches,
  mockVoucherCodes,
  mockVoucherPartners,
  mockVoucherTargets,
} from "@/lib/evoucher/mock-data"
import type {
  DiscountType,
  VoucherBatch,
  VoucherBatchStatus,
  VoucherBatchView,
  VoucherCode,
  VoucherScope,
} from "@/lib/evoucher/types"
import {
  buildVoucherBatchView,
  formatDate,
  formatDiscount,
  generateCodes,
} from "@/lib/evoucher/utils"

// ─── Status Badge ─────────────────────────────────────────────────────────────

function VoucherStatusBadge({ status }: { status: VoucherBatchStatus }) {
  const map: Record<VoucherBatchStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    Active: { label: "Active", variant: "default" },
    Expired: { label: "Expired", variant: "secondary" },
    Depleted: { label: "Depleted", variant: "outline" },
    Revoked: { label: "Revoked", variant: "destructive" },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportBatchCSV(batch: VoucherBatch, codes: VoucherCode[]) {
  const batchCodes = codes.filter((c) => c.batchId === batch.id)
  const discount =
    batch.discountType === "percentage"
      ? `${batch.discountValue}%`
      : `${batch.discountValue.toLocaleString("vi-VN")} VND`

  const header = "Code,Voucher Name,Applicable To,Assigned To (Partner),Valid From,Valid Until,Discount,Description,Status"
  const rows = batchCodes.map((c) =>
    [
      c.code,
      `"${batch.name}"`,
      `${batch.applicableTo === "expo" ? "Expo" : "Service"}: ${batch.targetName}`,
      batch.assignedToPartnerName,
      batch.validFrom,
      batch.validUntil,
      discount,
      `"${batch.description ?? ""}"`,
      c.status,
    ].join(","),
  )

  const csv = [header, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  const today = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `evoucher-${batch.codePrefix.toLowerCase()}-${today}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Form Types ───────────────────────────────────────────────────────────────

interface FormState {
  codePrefix: string
  name: string
  applicableTo: VoucherScope | ""
  targetId: string
  assignedToPartnerId: string
  validFrom: string
  validUntil: string
  issuedQuantity: string
  discountType: DiscountType | ""
  discountValue: string
  description: string
}

const emptyForm: FormState = {
  codePrefix: "",
  name: "",
  applicableTo: "",
  targetId: "",
  assignedToPartnerId: "",
  validFrom: "",
  validUntil: "",
  issuedQuantity: "",
  discountType: "",
  discountValue: "",
  description: "",
}

// ─── Create/Edit Dialog ───────────────────────────────────────────────────────

interface VoucherFormDialogProps {
  open: boolean
  onClose: () => void
  editing: VoucherBatchView | null
  existingPrefixes: Set<string>
  onSave: (batch: VoucherBatch, deltaCodes: VoucherCode[]) => void
}

function VoucherFormDialog({
  open,
  onClose,
  editing,
  existingPrefixes,
  onSave,
}: VoucherFormDialogProps) {
  const isEdit = editing !== null
  const hasRedemptions = isEdit ? editing.redeemedCount > 0 : false

  const [form, setForm] = useState<FormState>(() => {
    if (editing) {
      return {
        codePrefix: editing.codePrefix,
        name: editing.name,
        applicableTo: editing.applicableTo,
        targetId: editing.targetId,
        assignedToPartnerId: editing.assignedToPartnerId,
        validFrom: editing.validFrom,
        validUntil: editing.validUntil,
        issuedQuantity: String(editing.issuedQuantity),
        discountType: editing.discountType,
        discountValue: String(editing.discountValue),
        description: editing.description ?? "",
      }
    }
    return emptyForm
  })

  // Reset form when dialog opens
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "form", string>>>({})

  const filteredTargets = useMemo(
    () => mockVoucherTargets.filter((t) => t.type === form.applicableTo),
    [form.applicableTo],
  )

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: typeof errors = {}

    if (!isEdit) {
      if (!form.codePrefix.trim()) errs.codePrefix = "Code Prefix is required."
      else if (existingPrefixes.has(form.codePrefix.trim().toUpperCase())) {
        errs.codePrefix = "Code Prefix already exists on the platform."
      }
    }

    if (!form.name.trim()) errs.name = "Name is required."
    if (!isEdit && !form.applicableTo) errs.applicableTo = "Please select a scope."
    if (!isEdit && !form.targetId) errs.targetId = "Please select a target."
    if (!form.assignedToPartnerId) errs.assignedToPartnerId = "Please assign a partner."
    if (!form.validFrom) errs.validFrom = "Valid From is required."
    if (!form.validUntil) errs.validUntil = "Valid Until is required."
    else if (form.validFrom && form.validUntil <= form.validFrom) {
      errs.validUntil = "Valid Until must be after Valid From."
    }

    if (isEdit && editing) {
      if (form.validUntil < editing.validUntil) {
        errs.validUntil = "Valid Until can only be extended, not shortened."
      }
      const newQty = Number(form.issuedQuantity)
      if (newQty < editing.redeemedCount) {
        errs.issuedQuantity = `Cannot reduce below number already redeemed (${editing.redeemedCount}).`
      }
      if (newQty < editing.issuedQuantity) {
        errs.issuedQuantity = "Issued Quantity can only be increased."
      }
    }

    if (!form.issuedQuantity || Number(form.issuedQuantity) < 1) {
      errs.issuedQuantity = "Issued Quantity must be at least 1."
    }

    if (!form.discountType) errs.discountType = "Please select a discount type."
    const dv = Number(form.discountValue)
    if (!form.discountValue || dv <= 0) {
      errs.discountValue = "Discount Value must be greater than 0."
    } else if (form.discountType === "percentage" && (dv < 1 || dv > 100)) {
      errs.discountValue = "Percentage must be between 1 and 100."
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSave() {
    if (!validate()) return

    const prefix = form.codePrefix.trim().toUpperCase()
    const now = new Date().toISOString()

    if (isEdit && editing) {
      const newQty = Number(form.issuedQuantity)
      const delta = newQty - editing.issuedQuantity
      const updatedBatch: VoucherBatch = {
        ...editing,
        name: form.name.trim(),
        assignedToPartnerId: form.assignedToPartnerId,
        assignedToPartnerName:
          mockVoucherPartners.find((p) => p.id === form.assignedToPartnerId)?.name ??
          editing.assignedToPartnerName,
        validUntil: form.validUntil,
        issuedQuantity: newQty,
        discountType: hasRedemptions ? editing.discountType : (form.discountType as DiscountType),
        discountValue: hasRedemptions ? editing.discountValue : Number(form.discountValue),
        description: form.description,
        updatedAt: now,
      }
      const deltaCodes =
        delta > 0
          ? generateCodes(
              editing.id,
              editing.codePrefix,
              delta,
              new Set(mockVoucherCodes.filter((c) => c.batchId === editing.id).map((c) => c.code)),
            )
          : []
      onSave(updatedBatch, deltaCodes)
    } else {
      const id = `batch-${Date.now()}`
      const target = mockVoucherTargets.find((t) => t.id === form.targetId)
      const partner = mockVoucherPartners.find((p) => p.id === form.assignedToPartnerId)
      const newBatch: VoucherBatch = {
        id,
        codePrefix: prefix,
        name: form.name.trim(),
        applicableTo: form.applicableTo as VoucherScope,
        targetId: form.targetId,
        targetName: target?.name ?? form.targetId,
        assignedToPartnerId: form.assignedToPartnerId,
        assignedToPartnerName: partner?.name ?? form.assignedToPartnerId,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        issuedQuantity: Number(form.issuedQuantity),
        discountType: form.discountType as DiscountType,
        discountValue: Number(form.discountValue),
        description: form.description || undefined,
        isRevoked: false,
        createdAt: now,
        updatedAt: now,
      }
      const newCodes = generateCodes(id, prefix, Number(form.issuedQuantity))
      onSave(newBatch, newCodes)
    }
  }

  const fieldClass = "space-y-1"
  const errClass = "text-destructive text-xs mt-1"

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-xl! max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Voucher Batch" : "Create eVoucher Batch"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update allowed fields. Some fields are locked after creation or first redemption."
              : "Fill in all required fields to create a new voucher batch."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Code Prefix */}
          <div className={fieldClass}>
            <Label htmlFor="codePrefix">
              Code Prefix <span className="text-destructive">*</span>
            </Label>
            <Input
              id="codePrefix"
              placeholder="e.g. EXPO2025"
              value={form.codePrefix}
              onChange={(e) => set("codePrefix", e.target.value.toUpperCase())}
              disabled={isEdit}
            />
            {errors.codePrefix && <p className={errClass}>{errors.codePrefix}</p>}
            {isEdit && (
              <p className="text-muted-foreground text-xs">Code Prefix is immutable after creation.</p>
            )}
          </div>

          {/* Name */}
          <div className={fieldClass}>
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Display name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            {errors.name && <p className={errClass}>{errors.name}</p>}
          </div>

          {/* Applicable To + Target */}
          <div className="grid grid-cols-2 gap-3">
            <div className={fieldClass}>
              <Label>
                Applicable To <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.applicableTo}
                onValueChange={(v) => {
                  set("applicableTo", v as VoucherScope)
                  set("targetId", "")
                }}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expo">Expo</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
              {errors.applicableTo && <p className={errClass}>{errors.applicableTo}</p>}
            </div>

            <div className={fieldClass}>
              <Label>
                Target <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.targetId}
                onValueChange={(v) => set("targetId", v)}
                disabled={isEdit || !form.applicableTo}
              >
                <SelectTrigger>
                  <SelectValue placeholder={form.applicableTo ? "Select target" : "Select scope first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredTargets.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.targetId && <p className={errClass}>{errors.targetId}</p>}
              {isEdit && (
                <p className="text-muted-foreground text-xs">Target is immutable after creation.</p>
              )}
            </div>
          </div>

          {/* Assigned To */}
          <div className={fieldClass}>
            <Label>
              Assigned To (Partner) <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.assignedToPartnerId}
              onValueChange={(v) => set("assignedToPartnerId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select partner" />
              </SelectTrigger>
              <SelectContent>
                {mockVoucherPartners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assignedToPartnerId && (
              <p className={errClass}>{errors.assignedToPartnerId}</p>
            )}
          </div>

          {/* Valid Period */}
          <div className="grid grid-cols-2 gap-3">
            <div className={fieldClass}>
              <Label htmlFor="validFrom">
                Valid From <span className="text-destructive">*</span>
              </Label>
              <Input
                id="validFrom"
                type="date"
                value={form.validFrom}
                onChange={(e) => set("validFrom", e.target.value)}
                disabled={isEdit}
              />
              {errors.validFrom && <p className={errClass}>{errors.validFrom}</p>}
            </div>

            <div className={fieldClass}>
              <Label htmlFor="validUntil">
                Valid Until <span className="text-destructive">*</span>
              </Label>
              <Input
                id="validUntil"
                type="date"
                value={form.validUntil}
                onChange={(e) => set("validUntil", e.target.value)}
              />
              {errors.validUntil && <p className={errClass}>{errors.validUntil}</p>}
              {isEdit && (
                <p className="text-muted-foreground text-xs">Can only be extended, not shortened.</p>
              )}
            </div>
          </div>

          {/* Issued Quantity */}
          <div className={fieldClass}>
            <Label htmlFor="issuedQuantity">
              Issued Quantity <span className="text-destructive">*</span>
            </Label>
            <Input
              id="issuedQuantity"
              type="number"
              min={isEdit ? editing?.issuedQuantity : 1}
              value={form.issuedQuantity}
              onChange={(e) => set("issuedQuantity", e.target.value)}
            />
            {errors.issuedQuantity && <p className={errClass}>{errors.issuedQuantity}</p>}
            {isEdit && (
              <p className="text-muted-foreground text-xs">
                Can only be increased. Currently: {editing?.issuedQuantity}.
              </p>
            )}
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div className={fieldClass}>
              <Label>
                Discount Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.discountType}
                onValueChange={(v) => set("discountType", v as DiscountType)}
                disabled={hasRedemptions}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (VND)</SelectItem>
                </SelectContent>
              </Select>
              {errors.discountType && <p className={errClass}>{errors.discountType}</p>}
              {hasRedemptions && (
                <p className="text-muted-foreground text-xs">Locked — redemptions exist.</p>
              )}
            </div>

            <div className={fieldClass}>
              <Label htmlFor="discountValue">
                Discount Value <span className="text-destructive">*</span>
              </Label>
              <Input
                id="discountValue"
                type="number"
                min={1}
                max={form.discountType === "percentage" ? 100 : undefined}
                value={form.discountValue}
                onChange={(e) => set("discountValue", e.target.value)}
                disabled={hasRedemptions}
                placeholder={form.discountType === "percentage" ? "1–100" : "e.g. 500000"}
              />
              {errors.discountValue && <p className={errClass}>{errors.discountValue}</p>}
            </div>
          </div>

          {/* Description */}
          <div className={fieldClass}>
            <Label htmlFor="description">Description / Conditions</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Usage conditions shown to the business at checkout..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{isEdit ? "Save Changes" : "Create Batch"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export function EVoucherManagement() {
  const [batches, setBatches] = useState<VoucherBatch[]>(() =>
    mockVoucherBatches.map((b) => ({ ...b })),
  )
  const [codes, setCodes] = useState<VoucherCode[]>(() => mockVoucherCodes.map((c) => ({ ...c })))

  // Filters
  const [statusFilter, setStatusFilter] = useState<VoucherBatchStatus | "all">("all")
  const [scopeFilter, setScopeFilter] = useState<VoucherScope | "all">("all")
  const [partnerFilter, setPartnerFilter] = useState<string>("all")
  const [search, setSearch] = useState("")

  // Pagination
  const [page, setPage] = useState(1)

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState<VoucherBatchView | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<VoucherBatchView | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const views = useMemo<VoucherBatchView[]>(
    () => batches.map((b) => buildVoucherBatchView(b, codes)),
    [batches, codes],
  )

  const filtered = useMemo(() => {
    return views.filter((v) => {
      if (statusFilter !== "all" && v.derivedStatus !== statusFilter) return false
      if (scopeFilter !== "all" && v.applicableTo !== scopeFilter) return false
      if (partnerFilter !== "all" && v.assignedToPartnerId !== partnerFilter) return false
      if (
        search &&
        !v.name.toLowerCase().includes(search.toLowerCase()) &&
        !v.codePrefix.toLowerCase().includes(search.toLowerCase()) &&
        !v.targetName.toLowerCase().includes(search.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [views, statusFilter, scopeFilter, partnerFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const existingPrefixes = useMemo(
    () => new Set(batches.map((b) => b.codePrefix.toUpperCase())),
    [batches],
  )

  function handleSave(updatedBatch: VoucherBatch, deltaCodes: VoucherCode[]) {
    setBatches((prev) => {
      const idx = prev.findIndex((b) => b.id === updatedBatch.id)
      if (idx === -1) return [updatedBatch, ...prev]
      const next = [...prev]
      next[idx] = updatedBatch
      return next
    })
    if (deltaCodes.length > 0) {
      setCodes((prev) => [...prev, ...deltaCodes])
    }
    const isNew = !batches.find((b) => b.id === updatedBatch.id)
    setSuccessMsg(
      isNew
        ? `Batch "${updatedBatch.name}" created with ${updatedBatch.issuedQuantity} codes.`
        : `Batch "${updatedBatch.name}" updated.${deltaCodes.length > 0 ? ` ${deltaCodes.length} new codes generated.` : ""}`,
    )
    setTimeout(() => setSuccessMsg(null), 4000)
    setFormOpen(false)
    setEditingBatch(null)
    setPage(1)
  }

  function handleRevoke() {
    if (!revokeTarget) return
    setBatches((prev) =>
      prev.map((b) =>
        b.id === revokeTarget.id
          ? { ...b, isRevoked: true, updatedAt: new Date().toISOString() }
          : b,
      ),
    )
    setSuccessMsg(`Batch "${revokeTarget.name}" has been revoked.`)
    setTimeout(() => setSuccessMsg(null), 4000)
    setRevokeTarget(null)
  }

  function clearFilters() {
    setStatusFilter("all")
    setScopeFilter("all")
    setPartnerFilter("all")
    setSearch("")
    setPage(1)
  }

  const hasFilters =
    statusFilter !== "all" || scopeFilter !== "all" || partnerFilter !== "all" || search !== ""

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          <CheckCircle2Icon className="size-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="w-56"
          placeholder="Search name, prefix, target…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as VoucherBatchStatus | "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Expired">Expired</SelectItem>
            <SelectItem value="Depleted">Depleted</SelectItem>
            <SelectItem value="Revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={scopeFilter}
          onValueChange={(v) => {
            setScopeFilter(v as VoucherScope | "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="expo">Expo</SelectItem>
            <SelectItem value="service">Service</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={partnerFilter}
          onValueChange={(v) => {
            setPartnerFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Partner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Partners</SelectItem>
            {mockVoucherPartners.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <FilterXIcon className="mr-1 size-4" />
            Clear
          </Button>
        )}

        <Button
          className="ml-auto"
          onClick={() => {
            setEditingBatch(null)
            setFormOpen(true)
          }}
        >
          <PlusIcon className="mr-1 size-4" />
          Create eVoucher
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code Prefix</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Applicable To</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Valid Period</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                  <AlertCircleIcon className="mx-auto mb-2 size-8 opacity-40" />
                  No voucher batches found.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-sm font-medium">{v.codePrefix}</TableCell>
                  <TableCell className="max-w-48 truncate">{v.name}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-xs">
                      {v.applicableTo === "expo" ? "Expo" : "Service"}:
                    </span>{" "}
                    <span className="text-sm">{v.targetName}</span>
                  </TableCell>
                  <TableCell className="text-sm">{v.assignedToPartnerName}</TableCell>
                  <TableCell className="text-nowrap text-sm">
                    {formatDate(v.validFrom)} – {formatDate(v.validUntil)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <span className="font-medium">{v.issuedQuantity}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span
                      className={
                        v.remainingCount === 0 ? "text-destructive" : "text-foreground"
                      }
                    >
                      {v.remainingCount}
                    </span>
                    {v.lockedCount > 0 && (
                      <span className="text-muted-foreground text-xs"> ({v.lockedCount} locked)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatDiscount(v.discountType, v.discountValue)}
                  </TableCell>
                  <TableCell>
                    <VoucherStatusBadge status={v.derivedStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        disabled={v.derivedStatus === "Revoked"}
                        onClick={() => {
                          setEditingBatch(v)
                          setFormOpen(true)
                        }}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Export Codes"
                        onClick={() => exportBatchCSV(v, codes)}
                      >
                        <DownloadIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Revoke"
                        disabled={v.derivedStatus === "Revoked"}
                        onClick={() => setRevokeTarget(v)}
                        className="text-destructive hover:text-destructive"
                      >
                        <ShieldOffIcon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filtered.length} batch{filtered.length !== 1 ? "es" : ""} total
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span>
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      {formOpen && (
        <VoucherFormDialog
          open={formOpen}
          onClose={() => {
            setFormOpen(false)
            setEditingBatch(null)
          }}
          editing={editingBatch}
          existingPrefixes={
            editingBatch
              ? new Set([...existingPrefixes].filter((p) => p !== editingBatch.codePrefix.toUpperCase()))
              : existingPrefixes
          }
          onSave={handleSave}
        />
      )}

      {/* Revoke Confirm */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(o) => { if (!o) setRevokeTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Voucher Batch?</AlertDialogTitle>
            <AlertDialogDescription>
              Revoking <strong>{revokeTarget?.name}</strong> will immediately invalidate all unused
              codes. Any codes locked mid-transaction will enter Revoked state when their transaction
              resolves. <strong>This cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Revoke Batch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
