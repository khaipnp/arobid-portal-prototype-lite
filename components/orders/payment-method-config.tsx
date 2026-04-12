"use client"

import { CreditCardIcon, LandmarkIcon } from "lucide-react"
import { useState } from "react"
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
import { mockBankAccounts, mockPaymentConfig } from "@/lib/orders/mock-data"
import type { PaymentMethod } from "@/lib/tradexpo/types"
import { cn } from "@/lib/utils"

interface MethodCardProps {
  id: PaymentMethod
  label: string
  description: string
  icon: React.ReactNode
  selected: boolean
  onSelect: () => void
}

function MethodCard({
  label,
  description,
  icon,
  selected,
  onSelect,
}: MethodCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-4 rounded-xl border-2 p-5 text-left transition-all",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-muted-foreground/40",
      )}
    >
      <div
        className={cn(
          "mt-0.5 rounded-lg p-2",
          selected ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{label}</span>
          <span
            className={cn(
              "size-4 rounded-full border-2",
              selected
                ? "border-primary bg-primary"
                : "border-muted-foreground",
            )}
          />
        </div>
        <p className="mt-0.5 text-muted-foreground text-xs">{description}</p>
      </div>
    </button>
  )
}

export function PaymentMethodConfig() {
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>(
    mockPaymentConfig.activeMethod,
  )
  const [pendingMethod, setPendingMethod] = useState<PaymentMethod | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  function handleSelect(method: PaymentMethod) {
    if (method === activeMethod) return
    setError(null)

    if (method === "bank_transfer") {
      const hasPrimary = mockBankAccounts.some((b) => b.isPrimary && b.isActive)
      if (!hasPrimary) {
        setError(
          "No primary bank account configured. Please add a bank account in Bank Account Settings before activating Bank Transfer.",
        )
        return
      }
    }

    setPendingMethod(method)
  }

  function handleConfirm() {
    if (!pendingMethod) return
    setActiveMethod(pendingMethod)
    mockPaymentConfig.activeMethod = pendingMethod
    mockPaymentConfig.updatedAt = new Date().toISOString()
    mockPaymentConfig.updatedBy = "admin@arobid.com"
    setPendingMethod(null)
    showToast(
      `Payment method updated to ${pendingMethod === "vnpay" ? "VNPay" : "Bank Transfer"}.`,
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          Select the active payment method for all new customer checkouts. Only
          one method can be active at a time. Existing in-progress orders are
          not affected.
        </p>
      </div>

      <div className="space-y-3">
        <MethodCard
          id="vnpay"
          label="VNPay"
          description="Customers are redirected to the VNPay gateway to complete payment. Order status is updated automatically via gateway callback."
          icon={<CreditCardIcon className="size-5" />}
          selected={activeMethod === "vnpay"}
          onSelect={() => handleSelect("vnpay")}
        />
        <MethodCard
          id="bank_transfer"
          label="Bank Transfer (VietQR)"
          description="Customers scan a VietQR code and manually confirm their transfer. Admin reconciles each payment against the bank statement."
          icon={<LandmarkIcon className="size-5" />}
          selected={activeMethod === "bank_transfer"}
          onSelect={() => handleSelect("bank_transfer")}
        />
      </div>

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

      <div className="rounded-lg border bg-muted/40 px-4 py-3 text-muted-foreground text-xs">
        <strong>Current active method:</strong>{" "}
        {activeMethod === "vnpay" ? "VNPay" : "Bank Transfer"} · Last updated{" "}
        {new Date(mockPaymentConfig.updatedAt).toLocaleString("vi-VN")} by{" "}
        {mockPaymentConfig.updatedBy}
      </div>

      {/* Confirmation dialog */}
      <AlertDialog
        open={!!pendingMethod}
        onOpenChange={(open) => {
          if (!open) setPendingMethod(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {pendingMethod === "vnpay" ? "VNPay" : "Bank Transfer"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMethod === "bank_transfer"
                ? "All new orders will use QR bank transfer. Admin will need to manually reconcile each payment."
                : "All new orders will use the VNPay payment gateway. Customers will be redirected to VNPay at checkout."}{" "}
              This takes effect immediately for new orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
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
