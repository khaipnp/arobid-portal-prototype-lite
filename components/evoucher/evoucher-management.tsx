"use client";

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  FilterXIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type {
  DiscountType,
  VoucherBatch,
  VoucherBatchStatus,
  VoucherBatchView,
  VoucherCode,
  VoucherCodeType,
  VoucherScope,
  VoucherTarget,
} from "@/lib/evoucher/types";
import {
  buildVoucherBatchView,
  displayCode,
  formatDate,
  formatDiscount,
  generateCodes,
} from "@/lib/evoucher/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

// ─── Badges ───────────────────────────────────────────────────────────────────

function VoucherStatusBadge({ status }: { status: VoucherBatchStatus }) {
  const map: Record<
    VoucherBatchStatus,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    Active: { label: "Active", variant: "default" },
    Expired: { label: "Expired", variant: "secondary" },
    Depleted: { label: "Depleted", variant: "outline" },
    Revoked: { label: "Revoked", variant: "destructive" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function CodeTypeBadge({ type }: { type: VoucherCodeType }) {
  return type === "multi-use" ? (
    <Badge variant="default" className="bg-green-600">
      Multi-use
    </Badge>
  ) : (
    <Badge variant="default" className="bg-mauve-600">
      Single-use
    </Badge>
  );
}

function CodeTypeCard({
  active,
  badge,
  description,
  disabled,
  label,
  onClick,
}: {
  active: boolean;
  badge: string;
  description: string;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={
        active
          ? "flex min-h-28 flex-col justify-between rounded-xl border border-primary bg-primary/5 p-4 text-left shadow-sm ring-1 ring-primary/20 transition disabled:cursor-not-allowed disabled:opacity-60"
          : "flex min-h-28 flex-col justify-between rounded-xl border border-border bg-background p-4 text-left transition hover:border-foreground/20 hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      <div className="flex w-full flex-col gap-2">
        <div className="flex flex-1 items-center justify-between">
          <div className="font-medium">{label}</div>
          <Badge
            variant={active ? "default" : "outline"}
            className="font-normal"
          >
            {badge}
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs leading-5">{description}</p>
      </div>
    </button>
  );
}

function DiscountTypeBadge({ type }: { type: DiscountType }) {
  return type === "percentage" ? (
    <Badge variant="secondary">Percent</Badge>
  ) : (
    <Badge variant="outline">Fixed</Badge>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportBatchCSV(
  batch: VoucherBatch,
  codes: VoucherCode[],
  remainingCount: number,
) {
  const today = new Date().toISOString().slice(0, 10);
  const discount =
    batch.discountType === "percentage"
      ? `${batch.discountValue}%`
      : `${batch.discountValue.toLocaleString("vi-VN")} VND`;
  const fileSlug =
    batch.codeType === "multi-use"
      ? batch.multiUseCode.toLowerCase()
      : batch.codePrefix.toLowerCase();

  let csv: string;

  const moduleLabel =
    batch.applicableTo === "expo" ? "TradeXpo" : "B2B Marketplace";

  if (batch.codeType === "multi-use") {
    const header =
      "Code,Voucher Name,Module,Valid From,Valid Until,Discount,Issued Quantity,Remaining,Description";
    const row = [
      batch.multiUseCode,
      `"${batch.name}"`,
      `${moduleLabel}: ${batch.targetName}`,
      batch.validFrom,
      batch.validUntil,
      discount,
      batch.issuedQuantity,
      remainingCount,
      `"${batch.description ?? ""}"`,
    ].join(",");
    csv = [header, row].join("\n");
  } else {
    const batchCodes = codes.filter((c) => c.batchId === batch.id);
    const header =
      "Code,Voucher Name,Module,Valid From,Valid Until,Discount,Description,Status";
    const rows = batchCodes.map((c) =>
      [
        c.code,
        `"${batch.name}"`,
        `${moduleLabel}: ${batch.targetName}`,
        batch.validFrom,
        batch.validUntil,
        discount,
        `"${batch.description ?? ""}"`,
        c.status,
      ].join(","),
    );
    csv = [header, ...rows].join("\n");
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `evoucher-${fileSlug}-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Form Types ───────────────────────────────────────────────────────────────

interface FormState {
  codeType: VoucherCodeType | "";
  codePrefix: string; // single-use
  multiUseCode: string; // multi-use
  name: string;
  applicableTo: VoucherScope | "";
  targetId: string;
  validFrom: string;
  validUntil: string;
  issuedQuantity: string;
  discountType: DiscountType | "";
  discountValue: string;
  description: string;
}

const emptyForm: FormState = {
  codeType: "single-use",
  codePrefix: "",
  multiUseCode: "",
  name: "",
  applicableTo: "",
  targetId: "",
  validFrom: "",
  validUntil: "",
  issuedQuantity: "",
  discountType: "",
  discountValue: "",
  description: "",
};

// ─── Create / Edit Dialog ─────────────────────────────────────────────────────

interface VoucherFormDialogProps {
  open: boolean;
  onClose: () => void;
  editing: VoucherBatchView | null;
  existingPrefixes: Set<string>;
  existingMultiUseCodes: Set<string>;
  existingCodes: VoucherCode[];
  targets: VoucherTarget[];
  onSave: (batch: VoucherBatch, deltaCodes: VoucherCode[]) => void;
}

function VoucherFormDialog({
  open,
  onClose,
  editing,
  existingPrefixes,
  existingMultiUseCodes,
  existingCodes,
  targets,
  onSave,
}: VoucherFormDialogProps) {
  const isEdit = editing !== null;
  const hasRedemptions = isEdit ? editing.redeemedCount > 0 : false;

  const [form, setForm] = useState<FormState>(() => {
    if (editing) {
      return {
        codeType: editing.codeType,
        codePrefix: editing.codePrefix,
        multiUseCode: editing.multiUseCode,
        name: editing.name,
        applicableTo: editing.applicableTo,
        targetId: editing.targetId,
        validFrom: editing.validFrom,
        validUntil: editing.validUntil,
        issuedQuantity: String(editing.issuedQuantity),
        discountType: editing.discountType,
        discountValue: String(editing.discountValue),
        description: editing.description ?? "",
      };
    }
    return emptyForm;
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState | "form", string>>
  >({});

  const filteredTargets = useMemo(
    () => targets.filter((t) => t.type === form.applicableTo),
    [form.applicableTo, targets],
  );
  const [targetPickerOpen, setTargetPickerOpen] = useState(false);
  const [targetSearch, setTargetSearch] = useState("");

  const selectedTarget = useMemo(
    () => targets.find((t) => t.id === form.targetId) ?? null,
    [form.targetId, targets],
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: typeof errors = {};

    if (!isEdit && !form.codeType) errs.codeType = "Please select a code type.";

    if (!isEdit) {
      if (form.codeType === "single-use") {
        if (!form.codePrefix.trim())
          errs.codePrefix = "Code Prefix is required.";
        else if (existingPrefixes.has(form.codePrefix.trim().toUpperCase())) {
          errs.codePrefix = "This Code Prefix already exists on the platform.";
        }
      } else if (form.codeType === "multi-use") {
        if (!form.multiUseCode.trim()) errs.multiUseCode = "Code is required.";
        else if (
          existingMultiUseCodes.has(form.multiUseCode.trim().toUpperCase())
        ) {
          errs.multiUseCode = "This code already exists on the platform.";
        }
      }
    }

    if (!form.name.trim()) errs.name = "Name is required.";
    if (!isEdit && !form.applicableTo)
      errs.applicableTo = "Please select a scope.";
    if (!isEdit && !form.targetId) errs.targetId = "Please select a target.";
    if (!form.validFrom) errs.validFrom = "Valid From is required.";
    if (!form.validUntil) errs.validUntil = "Valid Until is required.";
    else if (form.validFrom && form.validUntil <= form.validFrom) {
      errs.validUntil = "Valid Until must be after Valid From.";
    }

    if (isEdit && editing) {
      if (form.validUntil < editing.validUntil) {
        errs.validUntil = "Valid Until can only be extended, not shortened.";
      }
      const newQty = Number(form.issuedQuantity);
      if (newQty < editing.redeemedCount) {
        errs.issuedQuantity = `Cannot reduce below number already redeemed (${editing.redeemedCount}).`;
      }
      if (newQty < editing.issuedQuantity) {
        errs.issuedQuantity = "Issued Quantity can only be increased.";
      }
    }

    if (!form.issuedQuantity || Number(form.issuedQuantity) < 1) {
      errs.issuedQuantity = "Issued Quantity must be at least 1.";
    }

    if (!form.discountType)
      errs.discountType = "Please select a discount type.";
    const dv = Number(form.discountValue);
    if (!form.discountValue || dv <= 0) {
      errs.discountValue = "Discount Value must be greater than 0.";
    } else if (form.discountType === "percentage" && (dv < 1 || dv > 100)) {
      errs.discountValue = "Percentage must be between 1 and 100.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const now = new Date().toISOString();

    if (isEdit && editing) {
      const newQty = Number(form.issuedQuantity);
      const delta = newQty - editing.issuedQuantity;
      const updatedBatch: VoucherBatch = {
        ...editing,
        name: form.name.trim(),
        validUntil: form.validUntil,
        issuedQuantity: newQty,
        discountType: hasRedemptions
          ? editing.discountType
          : (form.discountType as DiscountType),
        discountValue: hasRedemptions
          ? editing.discountValue
          : Number(form.discountValue),
        description: form.description,
        updatedAt: now,
      };
      // Single-use: generate delta codes. Multi-use: just raise counter (no new codes).
      const deltaCodes =
        editing.codeType === "single-use" && delta > 0
          ? generateCodes(
              editing.id,
              editing.codePrefix,
              delta,
              new Set(
                existingCodes
                  .filter((c) => c.batchId === editing.id)
                  .map((c) => c.code),
              ),
            )
          : [];
      onSave(updatedBatch, deltaCodes);
    } else {
      const id = `batch-${Date.now()}`;
      const target = targets.find((t) => t.id === form.targetId);
      const codeType = form.codeType as VoucherCodeType;
      const prefix =
        codeType === "single-use" ? form.codePrefix.trim().toUpperCase() : "";
      const muCode =
        codeType === "multi-use" ? form.multiUseCode.trim().toUpperCase() : "";

      const newBatch: VoucherBatch = {
        id,
        codeType,
        codePrefix: prefix,
        multiUseCode: muCode,
        multiUseLockedCount: 0,
        multiUseRedeemedCount: 0,
        name: form.name.trim(),
        applicableTo: form.applicableTo as VoucherScope,
        targetId: form.targetId,
        targetName: target?.name ?? form.targetId,
        assignedToPartnerId: "",
        assignedToPartnerName: "",
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        issuedQuantity: Number(form.issuedQuantity),
        discountType: form.discountType as DiscountType,
        discountValue: Number(form.discountValue),
        description: form.description || undefined,
        isRevoked: false,
        createdAt: now,
        updatedAt: now,
      };
      const newCodes =
        codeType === "single-use"
          ? generateCodes(id, prefix, Number(form.issuedQuantity))
          : []; // multi-use: no individual codes
      onSave(newBatch, newCodes);
    }
  }

  const fieldClass = "space-y-1";
  const errClass = "text-destructive text-xs mt-1";
  const readonlyNote = (msg: string) => (
    <p className="text-muted-foreground text-xs">{msg}</p>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="h-[90vh] max-w-2xl! overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Voucher Batch" : "Create eVoucher"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update allowed fields. Some fields are locked after creation or first redemption."
              : "Fill in all required fields to create a new voucher."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 align-top">
          {/* Code Type */}
          <div className={fieldClass}>
            <div className="grid gap-3 sm:grid-cols-2">
              <CodeTypeCard
                active={form.codeType === "single-use"}
                badge="Single-use"
                label="Single-use batch"
                description="Generate unique codes. Each code can be redeemed once."
                disabled={isEdit}
                onClick={() => {
                  if (isEdit) return;
                  set("codeType", "single-use");
                  set("codePrefix", "");
                  set("multiUseCode", "");
                }}
              />
              <CodeTypeCard
                active={form.codeType === "multi-use"}
                badge="Multi-use"
                label="Shared code"
                description="Create one shared code that can be redeemed up to the max uses."
                disabled={isEdit}
                onClick={() => {
                  if (isEdit) return;
                  set("codeType", "multi-use");
                  set("codePrefix", "");
                  set("multiUseCode", "");
                }}
              />
            </div>
            {errors.codeType && <p className={errClass}>{errors.codeType}</p>}
            {isEdit && readonlyNote("Code Type is immutable after creation.")}
          </div>

          {/* Code Prefix (single-use) */}
          {(form.codeType === "single-use" || (!isEdit && !form.codeType)) && (
            <div
              className={fieldClass}
              style={{
                display:
                  form.codeType === "single-use" || (!isEdit && !form.codeType)
                    ? undefined
                    : "none",
              }}
            >
              {form.codeType === "single-use" && (
                <>
                  <Label htmlFor="codePrefix">
                    Code Prefix <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="codePrefix"
                    placeholder="e.g. EXPO2025 (leave blank for auto)"
                    value={form.codePrefix}
                    onChange={(e) =>
                      set("codePrefix", e.target.value.toUpperCase())
                    }
                    disabled={isEdit}
                  />
                  {errors.codePrefix && (
                    <p className={errClass}>{errors.codePrefix}</p>
                  )}
                  {isEdit &&
                    readonlyNote("Code Prefix is immutable after creation.")}
                </>
              )}
            </div>
          )}

          {/* Shared code (multi-use) */}
          {form.codeType === "multi-use" && (
            <div className={fieldClass}>
              <Label htmlFor="multiUseCode">
                Code<span className="text-destructive">*</span>
              </Label>
              <Input
                id="multiUseCode"
                placeholder="e.g. SUMMER25"
                value={form.multiUseCode}
                onChange={(e) =>
                  set("multiUseCode", e.target.value.toUpperCase())
                }
                disabled={isEdit}
                className="font-mono"
              />
              {errors.multiUseCode && (
                <p className={errClass}>{errors.multiUseCode}</p>
              )}
              {isEdit && readonlyNote("Code is immutable after creation.")}
            </div>
          )}

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
                Module <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.applicableTo}
                onValueChange={(v) => {
                  set("applicableTo", v as VoucherScope);
                  set("targetId", "");
                  setTargetSearch("");
                }}
                disabled={isEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expo">TradeXpo</SelectItem>
                  <SelectItem value="service">B2B Marketplace</SelectItem>
                </SelectContent>
              </Select>
              {errors.applicableTo && (
                <p className={errClass}>{errors.applicableTo}</p>
              )}
            </div>

            <div className={fieldClass}>
              <Label>
                Target <span className="text-destructive">*</span>
              </Label>
              <Popover
                open={targetPickerOpen}
                onOpenChange={(open) => {
                  setTargetPickerOpen(open);
                  if (!open) setTargetSearch("");
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    disabled={isEdit || !form.applicableTo}
                    className="w-full justify-between rounded-lg font-normal"
                  >
                    <span className="truncate">
                      {selectedTarget?.name ??
                        (form.applicableTo
                          ? "Select target"
                          : "Select scope first")}
                    </span>
                    <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-(--radix-popover-trigger-width) p-0"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search Expo / target..."
                      value={targetSearch}
                      onValueChange={setTargetSearch}
                    />
                    <CommandList className="mt-1">
                      <CommandEmpty>No target found.</CommandEmpty>
                      {filteredTargets
                        .filter((target) => {
                          const q = targetSearch.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            target.name.toLowerCase().includes(q) ||
                            target.id.toLowerCase().includes(q)
                          );
                        })
                        .map((t) => (
                          <CommandItem
                            key={t.id}
                            value={t.name}
                            onSelect={() => {
                              set("targetId", t.id);
                              setTargetPickerOpen(false);
                              setTargetSearch("");
                            }}
                          >
                            {t.name}
                          </CommandItem>
                        ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.targetId && <p className={errClass}>{errors.targetId}</p>}
              {isEdit && readonlyNote("Target is immutable after creation.")}
            </div>
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
              {errors.validFrom && (
                <p className={errClass}>{errors.validFrom}</p>
              )}
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
              {errors.validUntil && (
                <p className={errClass}>{errors.validUntil}</p>
              )}
              {isEdit && readonlyNote("Can only be extended, not shortened.")}
            </div>
          </div>

          {/* Issued Quantity */}
          <div className={fieldClass}>
            <Label htmlFor="issuedQuantity">
              {form.codeType === "multi-use" ? "Max Uses" : "Issued Quantity"}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="issuedQuantity"
              type="number"
              min={isEdit ? editing?.issuedQuantity : 1}
              value={form.issuedQuantity}
              onChange={(e) => set("issuedQuantity", e.target.value)}
              placeholder={
                form.codeType === "multi-use"
                  ? "Max total redemptions"
                  : "Number of codes to generate"
              }
            />
            {errors.issuedQuantity && (
              <p className={errClass}>{errors.issuedQuantity}</p>
            )}
            {isEdit && (
              <p className="text-muted-foreground text-xs">
                Can only be increased. Currently: {editing?.issuedQuantity}.
                {editing?.codeType === "multi-use"
                  ? " Raises redemption ceiling only — no new codes generated."
                  : " Generates additional codes for the delta."}
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (VND)</SelectItem>
                </SelectContent>
              </Select>
              {errors.discountType && (
                <p className={errClass}>{errors.discountType}</p>
              )}
              {hasRedemptions && readonlyNote("Locked — redemptions exist.")}
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
                placeholder={
                  form.discountType === "percentage" ? "1–100" : "e.g. 500000"
                }
              />
              {errors.discountValue && (
                <p className={errClass}>{errors.discountValue}</p>
              )}
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
              placeholder="Usage conditions shown to the business at checkout…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEdit ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

interface EVoucherManagementProps {
  initialBatches: VoucherBatch[];
  initialCodes: VoucherCode[];
  targets: VoucherTarget[];
}

export function EVoucherManagement({
  initialBatches,
  initialCodes,
  targets,
}: EVoucherManagementProps) {
  const [batches, setBatches] = useState<VoucherBatch[]>(() =>
    initialBatches.map((b) => ({ ...b })),
  );
  const [codes, setCodes] = useState<VoucherCode[]>(() =>
    initialCodes.map((c) => ({ ...c })),
  );

  // Filters
  const [statusFilter, setStatusFilter] = useState<VoucherBatchStatus | "all">(
    "all",
  );
  const [codeTypeFilter, setCodeTypeFilter] = useState<VoucherCodeType | "all">(
    "all",
  );
  const [scopeFilter, setScopeFilter] = useState<VoucherScope | "all">("all");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<VoucherBatchView | null>(
    null,
  );
  const [revokeTarget, setRevokeTarget] = useState<VoucherBatchView | null>(
    null,
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const views = useMemo<VoucherBatchView[]>(
    () => batches.map((b) => buildVoucherBatchView(b, codes)),
    [batches, codes],
  );

  const filtered = useMemo(() => {
    return views.filter((v) => {
      if (statusFilter !== "all" && v.derivedStatus !== statusFilter)
        return false;
      if (codeTypeFilter !== "all" && v.codeType !== codeTypeFilter)
        return false;
      if (scopeFilter !== "all" && v.applicableTo !== scopeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const codeDisplay =
          v.codeType === "multi-use" ? v.multiUseCode : v.codePrefix;
        if (
          !v.name.toLowerCase().includes(q) &&
          !codeDisplay.toLowerCase().includes(q) &&
          !v.targetName.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [views, statusFilter, codeTypeFilter, scopeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const existingPrefixes = useMemo(
    () =>
      new Set(
        batches
          .filter((b) => b.codeType === "single-use")
          .map((b) => b.codePrefix.toUpperCase()),
      ),
    [batches],
  );

  const existingMultiUseCodes = useMemo(
    () =>
      new Set(
        batches
          .filter((b) => b.codeType === "multi-use")
          .map((b) => b.multiUseCode.toUpperCase()),
      ),
    [batches],
  );

  function handleSave(updatedBatch: VoucherBatch, deltaCodes: VoucherCode[]) {
    setBatches((prev) => {
      const idx = prev.findIndex((b) => b.id === updatedBatch.id);
      if (idx === -1) return [updatedBatch, ...prev];
      const next = [...prev];
      next[idx] = updatedBatch;
      return next;
    });
    if (deltaCodes.length > 0) setCodes((prev) => [...prev, ...deltaCodes]);

    const isNew = !batches.find((b) => b.id === updatedBatch.id);
    const codeTypeLabel =
      updatedBatch.codeType === "multi-use"
        ? "multi-use code"
        : "single-use batch";
    setSuccessMsg(
      isNew
        ? `${updatedBatch.codeType === "multi-use" ? "Multi-use code" : "Batch"} "${updatedBatch.name}" created.${updatedBatch.codeType === "single-use" ? ` ${updatedBatch.issuedQuantity} codes generated.` : ""}`
        : `"${updatedBatch.name}" updated.${deltaCodes.length > 0 ? ` ${deltaCodes.length} new codes generated.` : ""}`,
    );
    setTimeout(() => setSuccessMsg(null), 4000);
    setFormOpen(false);
    setEditingBatch(null);
    setPage(1);
    void codeTypeLabel;
  }

  function handleRevoke() {
    if (!revokeTarget) return;
    setBatches((prev) =>
      prev.map((b) =>
        b.id === revokeTarget.id
          ? { ...b, isRevoked: true, updatedAt: new Date().toISOString() }
          : b,
      ),
    );
    setSuccessMsg(`"${revokeTarget.name}" has been revoked.`);
    setTimeout(() => setSuccessMsg(null), 4000);
    setRevokeTarget(null);
  }

  function clearFilters() {
    setStatusFilter("all");
    setCodeTypeFilter("all");
    setScopeFilter("all");
    setSearch("");
    setPage(1);
  }

  const hasFilters =
    statusFilter !== "all" ||
    codeTypeFilter !== "all" ||
    scopeFilter !== "all" ||
    search !== "";

  return (
    <div className="mt-6 space-y-4">
      {successMsg && (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          <CheckCircle2Icon className="size-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="w-xs">
          <InputGroupInput
            placeholder="Name, code, target…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          {search && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                className="rounded-full"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as VoucherBatchStatus | "all");
            setPage(1);
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
          value={codeTypeFilter}
          onValueChange={(v) => {
            setCodeTypeFilter(v as VoucherCodeType | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Code Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="single-use">Single-use</SelectItem>
            <SelectItem value="multi-use">Multi-use</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={scopeFilter}
          onValueChange={(v) => {
            setScopeFilter(v as VoucherScope | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            <SelectItem value="expo">TradeXpo</SelectItem>
            <SelectItem value="service">B2B Marketplace</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <FilterXIcon />
            Clear
          </Button>
        )}

        <Button
          size="lg"
          className="ml-auto"
          onClick={() => {
            setEditingBatch(null);
            setFormOpen(true);
          }}
        >
          Create New
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Module</TableHead>
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
                <TableCell
                  colSpan={10}
                  className="py-12 text-center text-muted-foreground"
                >
                  <AlertCircleIcon className="mx-auto mb-2 size-8 opacity-40" />
                  No vouchers found.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium font-mono text-sm">
                    {displayCode(v)}
                  </TableCell>
                  <TableCell>
                    <CodeTypeBadge type={v.codeType} />
                  </TableCell>
                  <TableCell className="max-w-40 truncate">{v.name}</TableCell>
                  <TableCell className="flex flex-col">
                    <span>{v.targetName}</span>
                    <span className="text-muted-foreground text-xs">
                      {v.applicableTo === "expo"
                        ? "TradeXpo"
                        : "B2B Marketplace"}
                    </span>
                  </TableCell>
                  <TableCell className="text-nowrap text-sm">
                    {formatDate(v.validFrom)} – {formatDate(v.validUntil)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <span
                      className={
                        v.remainingCount === 0 ? "text-destructive" : ""
                      }
                    >
                      {v.remainingCount}
                    </span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="font-medium">{v.issuedQuantity}</span>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger>
                        <DiscountTypeBadge type={v.discountType} />
                      </TooltipTrigger>
                      <TooltipContent>
                        {formatDiscount(v.discountType, v.discountValue)}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <VoucherStatusBadge status={v.derivedStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" title="Actions">
                          <EllipsisVerticalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          disabled={v.derivedStatus === "Revoked"}
                          onClick={() => {
                            setEditingBatch(v);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            exportBatchCSV(v, codes, v.remainingCount)
                          }
                        >
                          Export Codes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={v.derivedStatus === "Revoked"}
                          onClick={() => setRevokeTarget(v)}
                        >
                          Revoke
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-muted-foreground text-sm">
          <span>
            {filtered.length} voucher{filtered.length !== 1 ? "s" : ""} total
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
            setFormOpen(false);
            setEditingBatch(null);
          }}
          editing={editingBatch}
          existingPrefixes={
            editingBatch
              ? new Set(
                  [...existingPrefixes].filter(
                    (p) => p !== editingBatch.codePrefix.toUpperCase(),
                  ),
                )
              : existingPrefixes
          }
          existingMultiUseCodes={
            editingBatch
              ? new Set(
                  [...existingMultiUseCodes].filter(
                    (c) => c !== editingBatch.multiUseCode.toUpperCase(),
                  ),
                )
              : existingMultiUseCodes
          }
          existingCodes={codes}
          targets={targets}
          onSave={handleSave}
        />
      )}

      {/* Revoke Confirm */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(o) => {
          if (!o) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Voucher?</AlertDialogTitle>
            <AlertDialogDescription>
              Revoking <strong>{revokeTarget?.name}</strong> will immediately
              invalidate all remaining{" "}
              {revokeTarget?.codeType === "multi-use" ? "uses" : "unused codes"}
              . Any{" "}
              {revokeTarget?.codeType === "multi-use"
                ? "locked units"
                : "codes locked mid-transaction"}{" "}
              will enter Revoked state when their transaction resolves.{" "}
              <strong>This cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
