"use server"

import {
  resetExpoPaymentConfig,
  upsertExpoPaymentConfig,
} from "@/lib/orders/db"
import type { ExpoPaymentConfig } from "@/lib/tradexpo/types"

export async function saveExpoPaymentConfig(input: {
  expoId: string
  vnpayEnabled: boolean
}): Promise<ExpoPaymentConfig> {
  if (!input.vnpayEnabled) {
    throw new Error(
      "VNPay is the only active payment method and cannot be disabled.",
    )
  }

  return upsertExpoPaymentConfig({
    expoId: input.expoId,
    vnpayEnabled: true,
    bankTransferEnabled: false,
    bankAccountId: null,
    updatedBy: "admin@arobid.com",
  })
}

export async function resetExpoPaymentConfigToDefault(
  expoId: string,
): Promise<void> {
  await resetExpoPaymentConfig(expoId)
}
