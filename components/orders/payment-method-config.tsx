"use client"

import { CreditCardIcon, MoreHorizontalIcon } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ExpoPaymentConfig, PaymentConfig } from "@/lib/tradexpo/types"

export function PaymentMethodConfig({
  initialPlatformPayment,
  expoPaymentConfigs,
  totalExpoCount,
}: {
  initialPlatformPayment: PaymentConfig
  expoPaymentConfigs: ExpoPaymentConfig[]
  totalExpoCount: number
}) {
  const [platformPayment, setPlatformPayment] = useState(initialPlatformPayment)
  const [vnpayEnabled, setVnpayEnabled] = useState(
    initialPlatformPayment.vnpayEnabled,
  )
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const customCount = expoPaymentConfigs.filter((c) => !c.isInherited).length
  const inheritingCount = totalExpoCount - customCount
  const paymentMethods = [
    {
      id: "vnpay",
      name: "VNPay",
      code: "VNPAY",
      description:
        "Customers are redirected to the VNPay gateway to complete payment. Order status is updated automatically via gateway callback.",
      icon: <CreditCardIcon className="size-4" />,
      enabled: vnpayEnabled,
    },
  ] as const

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  async function handleSetVNPayStatus(nextEnabled: boolean) {
    if (!nextEnabled) {
      setError("VNPay is the only active payment method and cannot be disabled.")
      return
    }
    try {
      const response = await fetch("/api/orders/platform-payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vnpayEnabled: nextEnabled }),
      })
      if (!response.ok) {
        throw new Error("Failed to update platform payment config")
      }
      const saved = (await response.json()) as PaymentConfig
      setPlatformPayment(saved)
      setError(null)
      setVnpayEnabled(saved.vnpayEnabled)
      showToast("Platform default payment configuration updated.")
    } catch {
      setError("Unable to update payment config.")
    }
  }

  function handleEditMethod(methodName: string) {
    showToast(`${methodName} edit flow will be available soon.`)
  }

  function handleRemoveMethod(methodName: string) {
    setError(
      `${methodName} cannot be removed because it is the only active payment method.`,
    )
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Method</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentMethods.map((method) => (
              <TableRow key={method.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium">{method.name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                  {method.description}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {method.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Open actions">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => handleSetVNPayStatus(!method.enabled)}
                      >
                        {method.enabled ? "Inactive" : "Active"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditMethod(method.name)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleRemoveMethod(method.name)}
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm">
          {error}
        </div>
      )}

      {toast && (
        <div className="fixed right-6 bottom-6 z-50 max-w-sm rounded-lg border bg-background px-4 py-3 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
