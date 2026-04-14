import { CheckoutOrderSummary } from "@/components/evoucher/voucher-checkout-widget"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

// Demo order context: a booth registration at VietTech Innovation Summit 2025
const DEMO_ORDER = {
  id: "order-checkout-demo",
  label: "Booth Registration — VietTech Innovation Summit 2025 (Standard Booth)",
  total: 5_000_000,
  scopeType: "expo" as const,
  scopeId: "expo-001",
}

// ─── Demo hint codes ──────────────────────────────────────────────────────────
const HINT_CODES = [
  { code: "EXPO2025-DEMO01", note: "15% off — valid for this expo (VietTech)" },
  { code: "TECHXPO-DEMO01", note: "5% off — also valid for VietTech (same expo)" },
  { code: "SVC2025-DEMO01", note: "Wrong scope (service voucher) — will fail" },
  { code: "NEWYR25-DEMO01", note: "Expired — will fail" },
  { code: "REVOKE24-DEMO01", note: "Revoked batch — will fail" },
  { code: "LAUNCH25-0001XX", note: "Depleted batch — will fail" },
]

export default function CheckoutDemoPage() {
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
        {/* Left: context + code hints */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Order Context</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Order ID:</span>{" "}
                <span className="font-mono">{DEMO_ORDER.id}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Item:</span> {DEMO_ORDER.label}
              </p>
              <p>
                <span className="text-muted-foreground">Scope:</span> Expo / VietTech Innovation Summit 2025
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Test Voucher Codes</h3>
            <p className="text-muted-foreground text-xs">
              Use these codes to test the various validation scenarios. Codes are case-insensitive.
            </p>
            <div className="space-y-2">
              {HINT_CODES.map(({ code, note }) => (
                <div key={code} className="flex items-start gap-2 text-xs">
                  <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {code}
                  </code>
                  <span className="text-muted-foreground">{note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">Redemption Lifecycle</h3>
            <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
              <li>Enter a code and click Apply — code transitions to <strong>Locked</strong></li>
              <li>Click Pay (Success) — code transitions to <strong>Redeemed</strong> (permanent)</li>
              <li>Click Fail or Cancel — code is released back to <strong>Available</strong></li>
              <li>Applying a second code while one is locked releases the first automatically</li>
            </ol>
          </div>
        </div>

        {/* Right: order summary + voucher widget */}
        <div>
          <CheckoutOrderSummary
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
