"use client"

import { CreditCardIcon, InfoIcon, LandmarkIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type {
  BankAccount,
  ExpoPaymentConfig,
  PaymentConfig,
} from "@/lib/tradexpo/types"

interface ToggleRowProps {
  icon: React.ReactNode
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
}

function ToggleRow({
  icon,
  label,
  description,
  enabled,
  onToggle,
}: ToggleRowProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border p-5">
      <div
        className={`mt-0.5 rounded-lg p-2 ${enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm">{label}</p>
            <p className="mt-0.5 text-muted-foreground text-xs">
              {description}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

export function PaymentMethodConfig({
  initialPlatformPayment,
  bankAccounts,
  expoPaymentConfigs,
  totalExpoCount,
}: {
  initialPlatformPayment: PaymentConfig
  bankAccounts: BankAccount[]
  expoPaymentConfigs: ExpoPaymentConfig[]
  totalExpoCount: number
}) {
  const [platformPayment, setPlatformPayment] = useState(initialPlatformPayment)
  const [vnpayEnabled, setVnpayEnabled] = useState(
    initialPlatformPayment.vnpayEnabled,
  )
  const [bankEnabled, setBankEnabled] = useState(
    initialPlatformPayment.bankTransferEnabled,
  )
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const customCount = expoPaymentConfigs.filter((c) => !c.isInherited).length
  const inheritingCount = totalExpoCount - customCount

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  function handleToggleVNPay() {
    const next = !vnpayEnabled
    if (!next && !bankEnabled) {
      setError("At least one payment method must be enabled.")
      return
    }
    setError(null)
    setVnpayEnabled(next)
  }

  function handleToggleBank() {
    const next = !bankEnabled
    if (!next && !vnpayEnabled) {
      setError("At least one payment method must be enabled.")
      return
    }
    if (next) {
      const hasActiveAccount = bankAccounts.some((b) => b.isActive)
      if (!hasActiveAccount) {
        setError(
          "No bank accounts configured. Please add a bank account in Bank Account Settings before enabling Bank Transfer.",
        )
        return
      }
    }
    setError(null)
    setBankEnabled(next)
  }

  async function handleSave() {
    if (!vnpayEnabled && !bankEnabled) {
      setError("At least one payment method must be enabled.")
      return
    }
    try {
      const response = await fetch("/api/orders/platform-payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vnpayEnabled,
          bankTransferEnabled: bankEnabled,
        }),
      })
      const data = (await response.json()) as
        | PaymentConfig
        | { error?: string }
      if (!response.ok) {
        setError(data && "error" in data ? data.error ?? "Save failed." : "Save failed.")
        return
      }
      setPlatformPayment(data as PaymentConfig)
      setError(null)
      showToast("Platform default payment configuration updated.")
    } catch {
      setError("Unable to update payment config.")
    }
  }

  const primaryAccount = bankAccounts.find((b) => b.isPrimary && b.isActive)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex gap-2 text-blue-800 text-sm dark:text-blue-300">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            This configuration applies to{" "}
            <strong>B2B Marketplace purchases</strong> and all{" "}
            <strong>
              {inheritingCount} Expo{inheritingCount !== 1 ? "s" : ""}
            </strong>{" "}
            that have not been individually configured. Expos with custom
            configs are not affected.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <ToggleRow
          icon={<CreditCardIcon className="size-5" />}
          label="VNPay"
          description="Customers are redirected to the VNPay gateway to complete payment. Order status is updated automatically via gateway callback."
          enabled={vnpayEnabled}
          onToggle={handleToggleVNPay}
        />
        <ToggleRow
          icon={<LandmarkIcon className="size-5" />}
          label="Bank Transfer (VietQR)"
          description="Customers scan a VietQR code and manually confirm their transfer. Admin reconciles each payment against the bank statement."
          enabled={bankEnabled}
          onToggle={handleToggleBank}
        />
      </div>

      {bankEnabled && primaryAccount && (
        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-muted-foreground text-xs">
          <strong>Primary bank account:</strong> {primaryAccount.bankName} ···
          {primaryAccount.accountNumber.slice(-4)} — used for all Bank Transfer
          QR codes where no Expo-specific account is configured.{" "}
          <a
            href="/admin/settings/bank-accounts"
            className="text-foreground underline underline-offset-2"
          >
            Manage accounts →
          </a>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm">
          {error}
          {error.includes("Bank Account Settings") && (
            <a
              href="/admin/settings/bank-accounts"
              className="ml-1 underline underline-offset-2"
            >
              Go to Bank Account Settings →
            </a>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-muted-foreground text-xs">
          Last updated{" "}
          {new Date(platformPayment.updatedAt).toLocaleString("vi-VN")} by{" "}
          {platformPayment.updatedBy}
        </p>
        <Button onClick={handleSave}>Save</Button>
      </div>

      {toast && (
        <div className="fixed right-6 bottom-6 z-50 max-w-sm rounded-lg border bg-background px-4 py-3 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
