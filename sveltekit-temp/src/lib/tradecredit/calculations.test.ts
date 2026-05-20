import { describe, expect, test } from "bun:test"
import {
  calculateEarnAward,
  calculateTradeCreditBurn,
  DEFAULT_CREDIT_VALUE_VND,
  MONTHLY_EARN_CAP
} from "$lib/tradecredit/calculations"

describe("TradeCredit calculations", () => {
  test("applies eVoucher before the 30 percent TradeCredit burn cap", () => {
    const result = calculateTradeCreditBurn({
      originalAmountVnd: 5_000_000,
      eVoucherDiscountVnd: 500_000,
      requestedCredits: 600,
      availableCredits: 600,
      creditValueVnd: DEFAULT_CREDIT_VALUE_VND
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.eligibleAmountVnd).toBe(4_500_000)
    expect(result.maxDiscountVnd).toBe(1_350_000)
    expect(result.creditAmount).toBe(540)
    expect(result.discountAmountVnd).toBe(1_350_000)
    expect(result.finalPayableVnd).toBe(3_150_000)
    expect(result.cappedByOrderValue).toBe(true)
  })

  test("blocks burn when the user requests more credits than available", () => {
    const result = calculateTradeCreditBurn({
      originalAmountVnd: 5_000_000,
      eVoucherDiscountVnd: 0,
      requestedCredits: 250,
      availableCredits: 100,
      creditValueVnd: DEFAULT_CREDIT_VALUE_VND
    })

    expect(result).toEqual({
      ok: false,
      reason: "insufficient_credits"
    })
  })

  test("blocks earn events that would exceed the monthly cap", () => {
    expect(
      calculateEarnAward({
        monthlyEarnedCredits: MONTHLY_EARN_CAP - 50,
        ruleCreditQuantity: 100
      })
    ).toEqual({
      ok: false,
      reason: "monthly_cap_exceeded"
    })
  })
})
