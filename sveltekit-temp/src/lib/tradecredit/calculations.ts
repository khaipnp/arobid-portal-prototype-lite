export const DEFAULT_CREDIT_VALUE_VND = 2_500
export const MONTHLY_EARN_CAP = 900
export const TRADECREDIT_DISCOUNT_CAP_RATIO = 0.3

export type TradeCreditBurnResult =
  | {
      ok: true
      eligibleAmountVnd: number
      maxDiscountVnd: number
      maxCredits: number
      creditAmount: number
      discountAmountVnd: number
      finalPayableVnd: number
      cappedByOrderValue: boolean
    }
  | {
      ok: false
      reason:
        | "invalid_credit_amount"
        | "invalid_credit_value"
        | "insufficient_credits"
        | "no_discount_available"
    }

export type EarnAwardResult =
  | { ok: true; creditAmount: number }
  | {
      ok: false
      reason: "invalid_credit_quantity" | "monthly_cap_exceeded"
    }

function wholeNumber(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.floor(value))
}

export function calculateTradeCreditBurn(input: {
  originalAmountVnd: number
  eVoucherDiscountVnd: number
  requestedCredits: number
  availableCredits: number
  creditValueVnd: number
}): TradeCreditBurnResult {
  const requestedCredits = wholeNumber(input.requestedCredits)
  const availableCredits = wholeNumber(input.availableCredits)
  const creditValueVnd = wholeNumber(input.creditValueVnd)

  if (requestedCredits <= 0) {
    return { ok: false, reason: "invalid_credit_amount" }
  }
  if (creditValueVnd <= 0) {
    return { ok: false, reason: "invalid_credit_value" }
  }
  if (requestedCredits > availableCredits) {
    return { ok: false, reason: "insufficient_credits" }
  }

  const originalAmountVnd = wholeNumber(input.originalAmountVnd)
  const eVoucherDiscountVnd = Math.min(
    wholeNumber(input.eVoucherDiscountVnd),
    originalAmountVnd
  )
  const eligibleAmountVnd = Math.max(originalAmountVnd - eVoucherDiscountVnd, 0)
  const maxDiscountVnd = Math.floor(
    eligibleAmountVnd * TRADECREDIT_DISCOUNT_CAP_RATIO
  )
  const maxCredits = Math.floor(maxDiscountVnd / creditValueVnd)
  const creditAmount = Math.min(requestedCredits, maxCredits)
  const discountAmountVnd = creditAmount * creditValueVnd

  if (creditAmount <= 0 || discountAmountVnd <= 0) {
    return { ok: false, reason: "no_discount_available" }
  }

  return {
    ok: true,
    eligibleAmountVnd,
    maxDiscountVnd,
    maxCredits,
    creditAmount,
    discountAmountVnd,
    finalPayableVnd: Math.max(eligibleAmountVnd - discountAmountVnd, 0),
    cappedByOrderValue: requestedCredits > maxCredits
  }
}

export function calculateEarnAward(input: {
  monthlyEarnedCredits: number
  ruleCreditQuantity: number
  monthlyCap?: number
}): EarnAwardResult {
  const monthlyEarnedCredits = wholeNumber(input.monthlyEarnedCredits)
  const ruleCreditQuantity = wholeNumber(input.ruleCreditQuantity)
  const monthlyCap = wholeNumber(input.monthlyCap ?? MONTHLY_EARN_CAP)

  if (ruleCreditQuantity <= 0) {
    return { ok: false, reason: "invalid_credit_quantity" }
  }
  if (monthlyEarnedCredits + ruleCreditQuantity > monthlyCap) {
    return { ok: false, reason: "monthly_cap_exceeded" }
  }

  return { ok: true, creditAmount: ruleCreditQuantity }
}
