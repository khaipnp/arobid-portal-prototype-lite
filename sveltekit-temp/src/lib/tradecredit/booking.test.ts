import { describe, expect, test } from "bun:test"
import {
  BOOTH_BOOKING_USD_TO_VND,
  getBoothBookingTradeCreditPreview
} from "$lib/tradecredit/booking"

describe("booth booking TradeCredit preview", () => {
  test("calculates booth booking totals in VND and applies requested credits", () => {
    const preview = getBoothBookingTradeCreditPreview({
      boothPriceUsd: 3000,
      availableCredits: 600,
      requestedCredits: 600,
      creditValueVnd: 2500
    })

    expect(BOOTH_BOOKING_USD_TO_VND).toBe(25_000)
    expect(preview.serviceFeeUsd).toBe(300)
    expect(preview.originalAmountVnd).toBe(82_500_000)
    expect(preview.creditAmount).toBe(600)
    expect(preview.tradeCreditDiscountVnd).toBe(1_500_000)
    expect(preview.finalPayableVnd).toBe(81_000_000)
  })

  test("caps usable credits at 30 percent of post-voucher order value", () => {
    const preview = getBoothBookingTradeCreditPreview({
      boothPriceUsd: 500,
      availableCredits: 5000,
      requestedCredits: 3000,
      creditValueVnd: 2500,
      eVoucherDiscountVnd: 250_000
    })

    expect(preview.eligibleAmountVnd).toBe(13_500_000)
    expect(preview.maxUsableCredits).toBe(1620)
    expect(preview.creditAmount).toBe(1620)
    expect(preview.tradeCreditDiscountVnd).toBe(4_050_000)
  })
})
