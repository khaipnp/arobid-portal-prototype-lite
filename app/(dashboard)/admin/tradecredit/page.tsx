import { TradeCreditPolicyManager } from "@/components/tradecredit/admin-policy-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  getActiveCreditValuation,
  listCreditRules,
  listCreditValuationHistory
} from "@/lib/tradecredit/db"

export const dynamic = "force-dynamic"

export default async function AdminTradeCreditPage() {
  await ensurePlatformSchema()
  await requireRole("admin")
  const [rules, activeValuation, valuationHistory] = await Promise.all([
    listCreditRules(),
    getActiveCreditValuation(),
    listCreditValuationHistory()
  ])

  return (
    <DashboardShell
      title="TradeCredit Policy"
      description="Configure system-defined earn/burn rules and active credit valuation."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "TradeCredit" }
      ]}
    >
      <TradeCreditPolicyManager
        initialRules={rules}
        activeValuation={activeValuation}
        valuationHistory={valuationHistory}
      />
    </DashboardShell>
  )
}
