"use server"

import { updatePlatformPaymentConfig } from "@/lib/orders/db"
import type { PaymentConfig } from "@/lib/tradexpo/types"

export async function savePlatformPaymentConfig(input: {
  vnpayEnabled: boolean
}): Promise<PaymentConfig> {
  if (!input.vnpayEnabled) {
    throw new Error("VNPay is the only active payment method and cannot be disabled.")
  }

  return updatePlatformPaymentConfig({
    vnpayEnabled: true,
    bankTransferEnabled: false,
    updatedBy: "admin@arobid.com",
  })
}
