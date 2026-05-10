"use client"

import { useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

type PaymentProcessingDialogProps = {
  isOpen: boolean
  onComplete: () => void
}

export function PaymentProcessingDialog({
  isOpen,
  onComplete
}: PaymentProcessingDialogProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onComplete()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onComplete])

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden border-none bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">Processing Payment</DialogTitle>
        <div className="flex flex-col items-center justify-center gap-6 rounded-3xl bg-white p-12">
          <div className="relative size-20">
            <Spinner className="size-20 text-legend" />
            <div className="absolute inset-0 flex items-center justify-center font-bold text-legend">
              $
            </div>
          </div>
          <div className="space-y-2 text-center">
            <h2 className="font-bold text-2xl text-foreground">
              Processing Payment
            </h2>
            <p className="max-w-3xs text-gray-500 text-sm">
              Please wait while we confirm your transaction with VNPay...
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
