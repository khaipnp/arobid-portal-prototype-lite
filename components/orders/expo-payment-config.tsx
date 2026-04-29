"use client"

import { CreditCardIcon, InfoIcon, RotateCcwIcon } from "lucide-react"
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
import type {
  Expo,
  ExpoPaymentConfig,
  PaymentConfig,
} from "@/lib/tradexpo/types"

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
  platformPayment: PaymentConfig
  onSave: (saved: ExpoPaymentConfig) => Promise<void>
  onReset: () => Promise<void>
}

function ExpoPaymentConfigPanel({
  expoId,
  expoName,
  configs,
  platformPayment,
  onSave,
  onReset,
}: ExpoPaymentConfigPanelProps) {
  const currentConfig = useMemo((): ExpoPaymentConfig => {
    const saved = configs.find((c) => c.expoId === expoId)
    if (saved) return saved
    return {
      expoId,
      isInherited: true,
      vnpayEnabled: platformPayment.vnpayEnabled,
      bankTransferEnabled: false,
      bankAccountId: null,
      updatedAt: platformPayment.updatedAt,
      updatedBy: platformPayment.updatedBy,
    }
  }, [configs, expoId, platformPayment])

  const [editing, setEditing] = useState<{
    vnpayEnabled: boolean
  } | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const isInherited = !configs.find((c) => c.expoId === expoId)
  const isEditing = !!editing

  function showToastMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  function startOverride() {
    setEditing({
      vnpayEnabled: currentConfig.vnpayEnabled,
    })
    setError(null)
  }

  function handleToggleVNPay() {
    if (!editing) return
    const next = !editing.vnpayEnabled
    if (!next) {
      setError(
        "VNPay is the only active payment method and cannot be disabled.",
      )
      return
    }
    setError(null)
    setEditing((e) => e && { ...e, vnpayEnabled: next })
  }

  async function handleSave() {
    if (!editing) return
    if (!editing.vnpayEnabled) {
      setError(
        "VNPay is the only active payment method and cannot be disabled.",
      )
      return
    }
    const saved: ExpoPaymentConfig = {
      expoId,
      isInherited: false,
      vnpayEnabled: editing.vnpayEnabled,
      bankTransferEnabled: false,
      bankAccountId: null,
      updatedAt: new Date().toISOString(),
      updatedBy: "admin@arobid.com",
    }
    try {
      await onSave(saved)
      setEditing(null)
      setError(null)
      showToastMsg(`Payment configuration saved for ${expoName}.`)
    } catch {
      setError("Unable to save expo payment configuration.")
    }
  }

  async function handleReset() {
    setShowResetConfirm(false)
    try {
      await onReset()
      setEditing(null)
      setError(null)
      showToastMsg(`Payment config for ${expoName} reset to platform default.`)
    } catch {
      setError("Unable to reset expo payment configuration.")
    }
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
      </div>

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

interface ExpoPaymentConfigManagerProps {
  expoId: string
  expo: Expo
  initialConfigs: ExpoPaymentConfig[]
  platformPayment: PaymentConfig
  onSaveConfig: (input: {
    expoId: string
    vnpayEnabled: boolean
  }) => Promise<ExpoPaymentConfig>
  onResetConfig: (expoId: string) => Promise<void>
}

export function ExpoPaymentConfigManager({
  expoId,
  expo,
  initialConfigs,
  platformPayment,
  onSaveConfig,
  onResetConfig,
}: ExpoPaymentConfigManagerProps) {
  const [configs, setConfigs] = useState<ExpoPaymentConfig[]>(() => [
    ...initialConfigs,
  ])

  async function handleSave(saved: ExpoPaymentConfig) {
    const persisted = await onSaveConfig({
      expoId: saved.expoId,
      vnpayEnabled: saved.vnpayEnabled,
    })
    setConfigs((prev) => {
      const idx = prev.findIndex((c) => c.expoId === persisted.expoId)
      const next = [...prev]
      if (idx !== -1) next[idx] = persisted
      else next.push(persisted)
      return next
    })
  }

  async function handleReset() {
    await onResetConfig(expoId)
    setConfigs((prev) => prev.filter((c) => c.expoId !== expoId))
  }

  return (
    <ExpoPaymentConfigPanel
      expoId={expo.id}
      expoName={expo.name}
      configs={configs}
      platformPayment={platformPayment}
      onSave={handleSave}
      onReset={handleReset}
    />
  )
}
