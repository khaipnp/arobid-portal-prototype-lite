import { describe, expect, test } from "bun:test"

describe("ensurePlatformPaymentConfig", () => {
  test("creates the default platform payment config when the row is missing", async () => {
    const calls: string[] = []
    const sql = (strings: TemplateStringsArray) => {
      calls.push(strings.join(""))
      return []
    }

    const { ensurePlatformPaymentConfig } = await import(
      "@/lib/platform/ensure-schema"
    )

    await ensurePlatformPaymentConfig(
      sql as unknown as Parameters<typeof ensurePlatformPaymentConfig>[0]
    )

    expect(calls.some((call) => call.includes("platform_payment_config"))).toBe(
      true
    )
    expect(
      calls.some((call) => call.includes("on conflict (id) do nothing"))
    ).toBe(true)
  })
})
