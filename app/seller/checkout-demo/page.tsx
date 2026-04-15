import { CheckoutOrderSummary } from "@/components/evoucher/voucher-checkout-widget"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { listVoucherBatches, listVoucherCodes } from "@/lib/evoucher/db"

export const dynamic = "force-dynamic"

const DEMO_ORDER = {
  id: "order-checkout-demo",
  label:
    "Booth Registration — VietTech Innovation Summit 2025 (Standard Booth)",
  total: 5_000_000,
  scopeType: "expo" as const,
  scopeId: "expo-001",
}

const HINT_CODES = [
  // Single-use — valid
  { code: "EXPO2025-DEMO01", note: "Single-use · 15% off VietTech — valid ✓" },
  { code: "TECHXPO-DEMO01", note: "Single-use · 5% off VietTech — valid ✓" },
  // Multi-use — valid
  {
    code: "SUMMER25",
    note: "Multi-use · 10% off VietTech · reusable across orders ✓",
  },
  {
    code: "IPTCWELCOME",
    note: "Multi-use · Discount 1.000.000 VND off VietTech · reusable across orders ✓",
  },
  // Failure cases
  { code: "SVC2025-DEMO01", note: "Wrong scope (service voucher) — will fail" },
  { code: "MEDPRO25", note: "Wrong scope (multi-use, service) — will fail" },
  { code: "NEWYR25-DEMO01", note: "Expired batch — will fail" },
  { code: "REVOKE24-DEMO01", note: "Revoked batch — will fail" },
  { code: "LAUNCH25-0001XX", note: "Depleted batch — will fail" },
]

export default async function CheckoutDemoPage() {
  const [batches, codes] = await Promise.all([
    listVoucherBatches(),
    listVoucherCodes(),
  ])

  return (
    <DashboardShell
      title="Checkout Demo — eVoucher"
      description="Apply an eVoucher code at checkout to see how the discount is calculated, locked, and resolved on payment."
      breadcrumbs={[
        { label: "Seller", href: "/seller" },
        { label: "Checkout Demo" },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: context + hints */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Order Context</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Order ID:</span>{" "}
                <span className="font-mono">{DEMO_ORDER.id}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Item:</span>{" "}
                {DEMO_ORDER.label}
              </p>
              <p>
                <span className="text-muted-foreground">Scope:</span> Expo /
                VietTech Innovation Summit 2025
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Test Voucher Codes</h3>
            <p className="text-muted-foreground text-xs">
              Codes are case-insensitive. Multi-use codes can be applied to
              multiple orders.
            </p>
            <div className="space-y-2">
              {HINT_CODES.map(({ code, note }) => (
                <div key={code} className="flex items-start gap-2 text-sm">
                  <div className="w-36 shrink-0">
                    <code className="text-xs shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono">
                      {code}
                    </code>
                  </div>
                  <span className="flex-1 text-foreground">{note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">Redemption Lifecycle</h3>
            <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
              <li>
                Enter a code and click Apply — one unit of quantity is{" "}
                <strong>Locked</strong>
              </li>
              <li>
                Click Pay (Success) — unit transitions to{" "}
                <strong>Redeemed</strong> (permanent)
              </li>
              <li>
                Click Fail or Cancel — unit is released back to{" "}
                <strong>Available</strong>
              </li>
              <li>
                <strong>Single-use</strong>: each individual code can only be
                redeemed once
              </li>
              <li>
                <strong>Multi-use</strong>: same code accepted again on a new
                order (if remaining &gt; 0)
              </li>
            </ol>
          </div>
        </div>

        {/* Right: order summary + voucher widget */}
        <div>
          <CheckoutOrderSummary
            batches={batches}
            codes={codes}
            orderLabel={DEMO_ORDER.label}
            orderTotal={DEMO_ORDER.total}
            orderScopeType={DEMO_ORDER.scopeType}
            orderScopeId={DEMO_ORDER.scopeId}
            orderId={DEMO_ORDER.id}
          />
        </div>
      </div>
    </DashboardShell>
  )
}
