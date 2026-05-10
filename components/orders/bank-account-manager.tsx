"use client"

import {
  AlertCircleIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  StarIcon
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
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
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
import { Toggle } from "@/components/ui/toggle"
import { VIETNAMESE_BANKS } from "@/lib/orders/bank-directory"
import type { BankAccount } from "@/lib/tradexpo/types"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "../ui/alert"

const BANKS = VIETNAMESE_BANKS

type FormState = {
  bankName: string
  bankBIN: string
  accountNumber: string
  accountHolderName: string
  branch: string
  isPrimary: boolean
}

const emptyForm: FormState = {
  bankName: "",
  bankBIN: "",
  accountNumber: "",
  accountHolderName: "",
  branch: "",
  isPrimary: false
}

export function BankAccountManager({
  initialBankAccounts,
  bankTransferEnabled
}: {
  initialBankAccounts: BankAccount[]
  bankTransferEnabled: boolean
}) {
  const [accounts, setAccounts] = useState<BankAccount[]>(() => [
    ...initialBankAccounts
  ])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<null | {
    type: "set-primary" | "deactivate" | "activate" | "delete"
    account: BankAccount
  }>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all")

  const visibleAccounts = useMemo(() => {
    const q = search.toLowerCase()
    return accounts.filter((a) => {
      if (statusFilter === "active" && !a.isActive) return false
      if (statusFilter === "inactive" && a.isActive) return false
      if (
        q &&
        !a.bankName.toLowerCase().includes(q) &&
        !a.accountNumber.includes(q) &&
        !a.accountHolderName.toLowerCase().includes(q)
      )
        return false
      return true
    })
  }, [accounts, search, statusFilter])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setShowFormDialog(true)
  }

  function openEdit(account: BankAccount) {
    setEditingId(account.id)
    setForm({
      bankName: account.bankName,
      bankBIN: account.bankBIN,
      accountNumber: account.accountNumber,
      accountHolderName: account.accountHolderName,
      branch: account.branch ?? "",
      isPrimary: account.isPrimary
    })
    setError(null)
    setShowFormDialog(true)
  }

  function handleBankSelect(name: string) {
    const bank = BANKS.find((b) => b.name === name)
    setForm((f) => ({
      ...f,
      bankName: name,
      bankBIN: bank?.bin ?? ""
    }))
  }

  async function handleSave() {
    if (
      !form.bankName ||
      !form.accountNumber.trim() ||
      !form.accountHolderName.trim()
    ) {
      setError("Please fill in all required fields.")
      return
    }

    try {
      if (editingId) {
        const response = await fetch(`/api/orders/bank-accounts/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            bankName: form.bankName,
            bankBIN: form.bankBIN,
            accountNumber: form.accountNumber.trim(),
            accountHolderName: form.accountHolderName.trim(),
            branch: form.branch.trim() || undefined,
            isPrimary: form.isPrimary
          })
        })
        if (!response.ok) throw new Error("Update failed")
        const now = new Date().toISOString()
        setAccounts((prev) =>
          prev.map((a) => {
            if (a.id === editingId) {
              return {
                ...a,
                bankName: form.bankName,
                bankBIN: form.bankBIN,
                accountNumber: form.accountNumber.trim(),
                accountHolderName: form.accountHolderName.trim(),
                branch: form.branch.trim() || undefined,
                isPrimary: form.isPrimary ? true : a.isPrimary,
                updatedAt: now
              }
            }
            if (form.isPrimary && a.id !== editingId) {
              return { ...a, isPrimary: false }
            }
            return a
          })
        )
        showToast("Bank account updated successfully.")
      } else {
        const response = await fetch("/api/orders/bank-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bankName: form.bankName,
            bankBIN: form.bankBIN,
            accountNumber: form.accountNumber.trim(),
            accountHolderName: form.accountHolderName.trim(),
            branch: form.branch.trim() || undefined,
            isPrimary: form.isPrimary
          })
        })
        if (!response.ok) throw new Error("Create failed")
        const data = (await response.json()) as { id: string }
        const now = new Date().toISOString()
        const newAccount: BankAccount = {
          id: data.id,
          bankName: form.bankName,
          bankBIN: form.bankBIN,
          accountNumber: form.accountNumber.trim(),
          accountHolderName: form.accountHolderName.trim(),
          branch: form.branch.trim() || undefined,
          isPrimary: form.isPrimary,
          isActive: true,
          createdAt: now,
          updatedAt: now
        }
        setAccounts((prev) => {
          const updated = form.isPrimary
            ? prev.map((a) => ({ ...a, isPrimary: false }))
            : prev
          return [...updated, newAccount]
        })
        showToast("Bank account added successfully.")
      }
      setShowFormDialog(false)
      setError(null)
    } catch {
      setError("Unable to save bank account.")
    }
  }

  function handleSetPrimary(account: BankAccount) {
    if (!account.isActive) {
      setError("Cannot set an inactive account as primary.")
      return
    }
    setConfirmAction({ type: "set-primary", account })
  }

  function handleToggleActive(account: BankAccount) {
    if (account.isActive) {
      // Deactivating
      if (account.isPrimary && bankTransferEnabled) {
        setError(
          `"${account.bankName} ···${account.accountNumber.slice(-4)}" is the active primary account for Bank Transfer payments. Please set a different primary account before deactivating.`
        )
        return
      }
      setConfirmAction({ type: "deactivate", account })
    } else {
      setConfirmAction({ type: "activate", account })
    }
  }

  function handleDelete(account: BankAccount) {
    if (account.isPrimary && bankTransferEnabled) {
      setError(
        "Cannot delete the primary account while Bank Transfer is enabled."
      )
      return
    }
    // In prototype we allow delete regardless of transaction history guard
    // (no transaction → account link in this mock)
    setConfirmAction({ type: "delete", account })
  }

  async function executeConfirm() {
    if (!confirmAction) return
    const { type, account } = confirmAction
    const now = new Date().toISOString()

    try {
      if (type === "delete") {
        const response = await fetch(
          `/api/orders/bank-accounts/${account.id}`,
          {
            method: "DELETE"
          }
        )
        if (!response.ok) throw new Error("Delete failed")
      } else {
        const action =
          type === "set-primary"
            ? "set-primary"
            : type === "activate"
              ? "activate"
              : "deactivate"
        const response = await fetch(
          `/api/orders/bank-accounts/${account.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action })
          }
        )
        if (!response.ok) throw new Error("Update failed")
      }
      setAccounts((prev) => {
        let updated: BankAccount[]
        if (type === "set-primary") {
          updated = prev.map((a) => ({
            ...a,
            isPrimary: a.id === account.id,
            updatedAt: a.id === account.id ? now : a.updatedAt
          }))
        } else if (type === "deactivate") {
          updated = prev.map((a) =>
            a.id === account.id ? { ...a, isActive: false, updatedAt: now } : a
          )
        } else if (type === "activate") {
          updated = prev.map((a) =>
            a.id === account.id ? { ...a, isActive: true, updatedAt: now } : a
          )
        } else {
          updated = prev.filter((a) => a.id !== account.id)
        }
        return updated
      })

      const messages: Record<string, string> = {
        "set-primary": `${account.bankName} ···${account.accountNumber.slice(-4)} is now the primary account.`,
        deactivate: "Account deactivated.",
        activate: "Account activated.",
        delete: "Account deleted."
      }
      showToast(messages[type])
      setConfirmAction(null)
      setError(null)
    } catch {
      setError("Unable to update bank account.")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-12">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by bank, account number, or holder…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openAdd} size="lg">
          <PlusIcon />
          Add New
        </Button>
      </div>

      {error && (
        <Alert variant="alert">
          <AlertCircleIcon />
          <AlertTitle>Alert</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <AlertAction>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </AlertAction>
        </Alert>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bank</TableHead>
              <TableHead>Account Number</TableHead>
              <TableHead>Account Holder</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleAccounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  {accounts.length === 0
                    ? "No bank accounts configured."
                    : "No accounts match your search."}
                </TableCell>
              </TableRow>
            ) : (
              visibleAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {account.bankName}
                      </span>
                      {account.isPrimary && (
                        <Badge className="gap-1 border-amber-300 bg-amber-100 text-amber-700 text-xs">
                          <StarIcon className="size-2.5" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      BIN: {account.bankBIN}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    ···{account.accountNumber.slice(-4)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {account.accountHolderName}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {account.branch ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        account.isActive
                          ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                          : "border-zinc-300 bg-zinc-100 text-zinc-500"
                      }
                    >
                      {account.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-8">
                          <MoreHorizontalIcon className="size-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(account)}>
                          Edit
                        </DropdownMenuItem>
                        {!account.isPrimary && account.isActive && (
                          <DropdownMenuItem
                            onClick={() => handleSetPrimary(account)}
                          >
                            Set as Primary
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(account)}
                        >
                          {account.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(account)}
                        >
                          Delete
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

      {/* Add / Edit Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit bank account" : "Add bank account"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && showFormDialog && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm">
                {error}
              </p>
            )}
            <div className="space-y-1.5">
              <Label>
                Bank <span className="text-destructive">*</span>
              </Label>
              <Select value={form.bankName} onValueChange={handleBankSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a bank" />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((b) => (
                    <SelectItem key={b.bin} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.bankBIN && (
                <p className="text-muted-foreground text-xs">
                  BIN: {form.bankBIN} (auto-filled)
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-number">
                Account Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="account-number"
                placeholder="Numeric account number"
                value={form.accountNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accountNumber: e.target.value }))
                }
                inputMode="numeric"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-holder">
                Account Holder Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="account-holder"
                placeholder="Must match bank records"
                value={form.accountHolderName}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    accountHolderName: e.target.value
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="branch">Branch (optional)</Label>
              <Input
                id="branch"
                placeholder="e.g. Chi nhánh Hà Nội"
                value={form.branch}
                onChange={(e) =>
                  setForm((f) => ({ ...f, branch: e.target.value }))
                }
              />
            </div>

            <Toggle
              pressed={form.isPrimary}
              onPressedChange={(v) => setForm((f) => ({ ...f, isPrimary: v }))}
              aria-label="Set as primary"
              variant="outline"
              size="sm"
            >
              <StarIcon />
              Set as Primary
            </Toggle>
            <p className="text-muted-foreground text-xs">
              Replaces the current primary account on customers' checkout QR.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "set-primary" &&
                "Set as primary account?"}
              {confirmAction?.type === "deactivate" && "Deactivate account?"}
              {confirmAction?.type === "activate" && "Activate account?"}
              {confirmAction?.type === "delete" && "Delete account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "set-primary" &&
                `Set ${confirmAction.account.bankName} ···${confirmAction.account.accountNumber.slice(-4)} as the primary account? This will be shown to customers during Bank Transfer checkout.`}
              {confirmAction?.type === "deactivate" &&
                `Deactivate ${confirmAction.account.bankName} ···${confirmAction.account.accountNumber.slice(-4)}? The account will remain visible but cannot be set as primary.`}
              {confirmAction?.type === "activate" &&
                `Reactivate ${confirmAction.account.bankName} ···${confirmAction.account.accountNumber.slice(-4)}?`}
              {confirmAction?.type === "delete" &&
                `Permanently delete ${confirmAction.account.bankName} ···${confirmAction.account.accountNumber.slice(-4)}? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeConfirm}
              className={
                confirmAction?.type === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {toast && (
        <div className="fixed right-6 bottom-6 z-50 max-w-sm rounded-lg border bg-background px-4 py-3 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
