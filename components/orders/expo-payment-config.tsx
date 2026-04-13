"use client"

import {
  CreditCardIcon,
  InfoIcon,
  LandmarkIcon,
  RotateCcwIcon,
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
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  mockBankAccounts,
  mockExpoPaymentConfigs,
  mockPaymentConfig,
} from "@/lib/orders/mock-data"
import { mockExpos } from "@/lib/tradexpo/mock-data"
import type { ExpoPaymentConfig } from "@/lib/tradexpo/types"
import { Label } from "../ui/label"

// ─── Toggle row ───────────────────────────────────────────────────────────────

interface ToggleRowProps {
  icon: React.ReactNode
  label: string
  enabled: boolean
  disabled?: boolean
  onToggle: () => void
}

function ToggleRow({
  icon,
  label,
  enabled,
  disabled,
  onToggle,
}: ToggleRowProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${disabled ? "opacity-60" : ""}`}
    >
      <div
        className={`rounded-md p-1.5 ${enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
      >
        {icon}
      </div>
      <span className="flex-1 font-medium text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed ${enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  )
}

// ─── Core config panel — used both standalone and embedded in expo detail ─────

interface ExpoPaymentConfigPanelProps {
  expoId: string
  expoName: string
  configs: ExpoPaymentConfig[]
  onSave: (saved: ExpoPaymentConfig) => void
  onReset: () => void
}

function ExpoPaymentConfigPanel({
  expoId,
  expoName,
  configs,
  onSave,
  onReset,
}: ExpoPaymentConfigPanelProps) {
  const currentConfig = useMemo((): ExpoPaymentConfig => {
    const saved = configs.find((c) => c.expoId === expoId)
    if (saved) return saved
    return {
      expoId,
      isInherited: true,
      vnpayEnabled: mockPaymentConfig.vnpayEnabled,
      bankTransferEnabled: mockPaymentConfig.bankTransferEnabled,
      bankAccountId: null,
      updatedAt: mockPaymentConfig.updatedAt,
      updatedBy: mockPaymentConfig.updatedBy,
    }
  }, [configs, expoId])

  const [editing, setEditing] = useState<{
    vnpayEnabled: boolean
    bankTransferEnabled: boolean
    bankAccountId: string | null
  } | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const isInherited = !configs.find((c) => c.expoId === expoId)
  const isEditing = !!editing

  const activeAccounts = mockBankAccounts.filter((b) => b.isActive)
  const primaryAccount = activeAccounts.find((b) => b.isPrimary)

  function showToastMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  function startOverride() {
    setEditing({
      vnpayEnabled: currentConfig.vnpayEnabled,
      bankTransferEnabled: currentConfig.bankTransferEnabled,
      bankAccountId: currentConfig.bankAccountId,
    })
    setError(null)
  }

  function handleToggleVNPay() {
    if (!editing) return
    const next = !editing.vnpayEnabled
    if (!next && !editing.bankTransferEnabled) {
      setError("At least one payment method must be enabled.")
      return
    }
    setError(null)
    setEditing((e) => e && { ...e, vnpayEnabled: next })
  }

  function handleToggleBank() {
    if (!editing) return
    const next = !editing.bankTransferEnabled
    if (!next && !editing.vnpayEnabled) {
      setError("At least one payment method must be enabled.")
      return
    }
    if (next) {
      const hasActive = mockBankAccounts.some((b) => b.isActive)
      if (!hasActive) {
        setError(
          "No bank accounts configured. Please add one in Bank Account Settings before enabling Bank Transfer.",
        )
        return
      }
    }
    setError(null)
    setEditing((e) => e && { ...e, bankTransferEnabled: next })
  }

  function handleSave() {
    if (!editing) return
    if (!editing.vnpayEnabled && !editing.bankTransferEnabled) {
      setError("At least one payment method must be enabled.")
      return
    }
    const saved: ExpoPaymentConfig = {
      expoId,
      isInherited: false,
      vnpayEnabled: editing.vnpayEnabled,
      bankTransferEnabled: editing.bankTransferEnabled,
      bankAccountId: editing.bankAccountId,
      updatedAt: new Date().toISOString(),
      updatedBy: "admin@arobid.com",
    }
    onSave(saved)
    setEditing(null)
    setError(null)
    showToastMsg(`Payment configuration saved for ${expoName}.`)
  }

  function handleReset() {
    setShowResetConfirm(false)
    onReset()
    setEditing(null)
    setError(null)
    showToastMsg(`Payment config for ${expoName} reset to platform default.`)
  }

  return (
    <div className="space-y-4">
      {/* Status banner */}
      {isInherited && !isEditing ? (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800 text-sm dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            This Expo is <strong>inheriting the platform default</strong>{" "}
            payment configuration. Changes to the platform default will apply
            here automatically.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            {isEditing
              ? "Editing custom configuration — save to apply changes."
              : "Custom configuration — this Expo uses its own payment settings."}
          </p>
        </div>
      )}

      {/* Payment method toggles */}
      <div className="space-y-2">
        <ToggleRow
          icon={<CreditCardIcon className="size-4" />}
          label="VNPay"
          enabled={
            isEditing ? editing.vnpayEnabled : currentConfig.vnpayEnabled
          }
          disabled={!isEditing}
          onToggle={handleToggleVNPay}
        />
        <ToggleRow
          icon={<LandmarkIcon className="size-4" />}
          label="Bank Transfer (VietQR)"
          enabled={
            isEditing
              ? editing.bankTransferEnabled
              : currentConfig.bankTransferEnabled
          }
          disabled={!isEditing}
          onToggle={handleToggleBank}
        />
      </div>

      {/* Bank account selector when editing */}
      {isEditing && editing.bankTransferEnabled && (
        <div className="space-y-1.5">
          <Label htmlFor="bank-account-select" className="font-medium text-sm">
            Bank Account for this Expo
          </Label>
          <Select
            value={editing.bankAccountId ?? "__primary__"}
            onValueChange={(v) =>
              setEditing(
                (e) =>
                  e && {
                    ...e,
                    bankAccountId: v === "__primary__" ? null : v,
                  },
              )
            }
          >
            <SelectTrigger id="bank-account-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__primary__">
                Use primary account
                {primaryAccount
                  ? ` (${primaryAccount.bankName} ···${primaryAccount.accountNumber.slice(-4)})`
                  : ""}
              </SelectItem>
              {activeAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.bankName} ···{a.accountNumber.slice(-4)}
                  {a.isPrimary ? " (Primary)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!editing.bankAccountId && primaryAccount && (
            <p className="text-muted-foreground text-xs">
              Will use primary account: {primaryAccount.bankName} ···
              {primaryAccount.accountNumber.slice(-4)}
            </p>
          )}
        </div>
      )}

      {/* Resolved bank account when not editing */}
      {!isEditing && currentConfig.bankTransferEnabled && (
        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-muted-foreground text-xs">
          <strong>Bank Transfer account:</strong> {(() => {
            const acct = currentConfig.bankAccountId
              ? mockBankAccounts.find(
                  (b) => b.id === currentConfig.bankAccountId,
                )
              : primaryAccount
            return acct
              ? `${acct.bankName} ···${acct.accountNumber.slice(-4)}${!currentConfig.bankAccountId ? " (primary fallback)" : ""}`
              : "No primary account configured"
          })()}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-4">
        <div>
          {!isInherited && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
            >
              <RotateCcwIcon className="size-3.5" />
              Reset to Platform Default
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setError(null)
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={startOverride}>
              {isInherited ? "Override for this Expo" : "Edit"}
            </Button>
          )}
        </div>
      </div>

      {!isEditing && (
        <p className="text-muted-foreground text-xs">
          Last updated{" "}
          {new Date(currentConfig.updatedAt).toLocaleString("vi-VN")} by{" "}
          {currentConfig.updatedBy}
          {isInherited && " (platform default)"}
        </p>
      )}

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to platform default?</AlertDialogTitle>
            <AlertDialogDescription>
              Reset payment config for <strong>{expoName}</strong>? This Expo
              will use the platform default and be affected by any future
              changes to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Confirm</AlertDialogAction>
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

// ─── Exported manager — owns configs state, syncs to mock source ──────────────

interface ExpoPaymentConfigManagerProps {
  /** When provided, renders only the config for this expo (no expo selector). */
  expoId?: string
}

export function ExpoPaymentConfigManager({
  expoId: fixedExpoId,
}: ExpoPaymentConfigManagerProps) {
  const [configs, setConfigs] = useState<ExpoPaymentConfig[]>(() => [
    ...mockExpoPaymentConfigs,
  ])
  const [selectedExpoId, setSelectedExpoId] = useState<string>(
    fixedExpoId ?? "",
  )

  const expoId = fixedExpoId ?? selectedExpoId
  const expo = mockExpos.find((e) => e.id === expoId)

  function handleSave(saved: ExpoPaymentConfig) {
    setConfigs((prev) => {
      const idx = prev.findIndex((c) => c.expoId === saved.expoId)
      const next = idx !== -1 ? [...prev] : [...prev]
      if (idx !== -1) next[idx] = saved
      else next.push(saved)
      return next
    })
    const idx = mockExpoPaymentConfigs.findIndex(
      (c) => c.expoId === saved.expoId,
    )
    if (idx !== -1) mockExpoPaymentConfigs[idx] = saved
    else mockExpoPaymentConfigs.push(saved)
  }

  function handleReset() {
    setConfigs((prev) => prev.filter((c) => c.expoId !== expoId))
    const idx = mockExpoPaymentConfigs.findIndex((c) => c.expoId === expoId)
    if (idx !== -1) mockExpoPaymentConfigs.splice(idx, 1)
  }

  // Embedded in expo detail — no selector needed
  if (fixedExpoId) {
    if (!expo)
      return <p className="text-muted-foreground text-sm">Expo not found.</p>
    return (
      <ExpoPaymentConfigPanel
        expoId={expo.id}
        expoName={expo.name}
        configs={configs}
        onSave={handleSave}
        onReset={handleReset}
      />
    )
  }

  // Standalone page with expo selector
  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1.5">
        <label htmlFor="expo-select" className="font-medium text-sm">
          Select Expo
        </label>
        <Select
          value={selectedExpoId}
          onValueChange={(v) => setSelectedExpoId(v)}
        >
          <SelectTrigger id="expo-select" className="w-full">
            <SelectValue placeholder="Choose an expo to configure…" />
          </SelectTrigger>
          <SelectContent>
            {mockExpos.map((e) => {
              const hasCustom = configs.some(
                (c) => c.expoId === e.id && !c.isInherited,
              )
              return (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                  {hasCustom ? " · Custom" : ""}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {!selectedExpoId ? (
        <div className="rounded-lg border bg-muted/40 py-10 text-center text-muted-foreground text-sm">
          Select an expo to view or configure its payment methods.
        </div>
      ) : (
        expo && (
          <ExpoPaymentConfigPanel
            expoId={expo.id}
            expoName={expo.name}
            configs={configs}
            onSave={handleSave}
            onReset={handleReset}
          />
        )
      )}
    </div>
  )
}
