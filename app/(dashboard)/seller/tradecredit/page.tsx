import { TradeCreditWalletView } from "@/components/tradecredit/tradecredit-wallet"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireAnyRole } from "@/lib/auth/rbac"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { getTradeCreditWallet } from "@/lib/tradecredit/db"

export const dynamic = "force-dynamic"

export default async function SellerTradeCreditPage() {
  await ensurePlatformSchema()
  const userId = await requireAnyRole(["seller", "buyer"])
  const wallet = await getTradeCreditWallet(userId)

  return (
    <DashboardShell
      title="TradeCredit Wallet"
      breadcrumbs={[
        { label: "Seller", href: "/seller" },
        { label: "TradeCredit" }
      ]}
    >
      <TradeCreditWalletView wallet={wallet} />
    </DashboardShell>
  )
}
