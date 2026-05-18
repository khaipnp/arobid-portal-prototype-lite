import { TRADECREDIT_DISCOUNT_CAP_RATIO } from "@/lib/tradecredit/calculations"

export const BOOTH_BOOKING_USD_TO_VND = 25_000
export const BOOTH_BOOKING_SERVICE_FEE_RATIO = 0.1

function wholeNumber(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.floor(value))
}

function positiveAmount(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, value)
}

export function getBoothBookingTradeCreditPreview(input: {
  boothPriceUsd: number
  availableCredits: number
  requestedCredits: number
  creditValueVnd: number
  eVoucherDiscountVnd?: number
}) {
  const boothPriceUsd = positiveAmount(input.boothPriceUsd)
  const serviceFeeUsd = boothPriceUsd * BOOTH_BOOKING_SERVICE_FEE_RATIO
  const subtotalUsd = boothPriceUsd + serviceFeeUsd
  const originalAmountVnd = Math.round(subtotalUsd * BOOTH_BOOKING_USD_TO_VND)
  const eVoucherDiscountVnd = Math.min(
    wholeNumber(input.eVoucherDiscountVnd ?? 0),
    originalAmountVnd
  )
  const eligibleAmountVnd = Math.max(originalAmountVnd - eVoucherDiscountVnd, 0)
  const creditValueVnd = wholeNumber(input.creditValueVnd)
  const maxDiscountVnd = Math.floor(
    eligibleAmountVnd * TRADECREDIT_DISCOUNT_CAP_RATIO
  )
  const maxCreditsByOrder =
    creditValueVnd > 0 ? Math.floor(maxDiscountVnd / creditValueVnd) : 0
  const maxUsableCredits = Math.min(
    wholeNumber(input.availableCredits),
    maxCreditsByOrder
  )
  const creditAmount = Math.min(
    wholeNumber(input.requestedCredits),
    maxUsableCredits
  )
  const tradeCreditDiscountVnd = creditAmount * creditValueVnd
  const finalPayableVnd = Math.max(
    eligibleAmountVnd - tradeCreditDiscountVnd,
    0
  )

  return {
    boothPriceUsd,
    serviceFeeUsd,
    subtotalUsd,
    originalAmountVnd,
    eVoucherDiscountVnd,
    eligibleAmountVnd,
    maxDiscountVnd,
    maxCreditsByOrder,
    maxUsableCredits,
    creditAmount,
    tradeCreditDiscountVnd,
    tradeCreditDiscountUsd: tradeCreditDiscountVnd / BOOTH_BOOKING_USD_TO_VND,
    finalPayableVnd,
    finalPayableUsd: finalPayableVnd / BOOTH_BOOKING_USD_TO_VND
  }
}
