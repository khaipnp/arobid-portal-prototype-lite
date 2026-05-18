import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type { CreditLedgerEntry, TradeCreditWallet } from "@/lib/tradecredit/types"
import { Badge } from "../ui/badge"

const numberFormat = new Intl.NumberFormat("en")

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

const typeLabels: Record<CreditLedgerEntry["type"], string> = {
  earn: "Earn",
  reserve: "Reserved",
  burn: "Burned",
  release: "Released",
  expire: "Expired",
  adjust: "Adjusted",
  reverse: "Reversed"
}

const sourceLabels: Record<string, string> = {
  tradexpo: "TradeXpo",
  b2b_marketplace: "B2B Marketplace",
  payment: "Checkout",
  system: "System",
  admin: "Admin"
}

function reasonLabel(entry: CreditLedgerEntry) {
  if (entry.reasonCode === "demo_initial_grant") return "Initial demo credit"
  if (entry.reasonCode.includes("booth_booking")) return "Booth booking paid"
  if (entry.reasonCode.includes("booth_discount")) {
    return "Booth checkout discount"
  }
  if (entry.sourceEventType === "payment_success") return "Payment success"
  if (entry.sourceEventType === "payment_released") return "Payment released"
  return entry.reasonCode.replaceAll("_", " ")
}

export function TradeCreditWalletView({
  wallet
}: {
  wallet: TradeCreditWallet
}) {
  const capProgress =
    wallet.monthlyCap > 0
      ? Math.min(100, Math.round((wallet.monthlyEarned / wallet.monthlyCap) * 100))
      : 0

  return (
    <div className="space-y-4 px-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Available Credits"
          value={numberFormat.format(wallet.account.availableBalance)}
          note="Credits available to burn"
        />
        <MetricCard
          title="Reserved Credits"
          value={numberFormat.format(wallet.account.reservedBalance)}
          note="Held for pending checkout"
        />
        <MetricCard
          title="Expiring Soon"
          value={numberFormat.format(wallet.expiringSoon)}
          note="Earn lots within 30 days"
        />
        <MetricCard
          title="Burned Lifetime"
          value={numberFormat.format(wallet.account.burnedLifetime)}
          note="Total credits used"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Earn Cap</CardTitle>
          <CardDescription>
            {numberFormat.format(wallet.monthlyEarned)} /{" "}
            {numberFormat.format(wallet.monthlyCap)} credits earned this month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={capProgress} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ledger History</CardTitle>
          <CardDescription>
            Credits are shown as points only. Monetary value is calculated only
            at eligible checkout.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wallet.ledger.length === 0 ? (
            <div className="flex min-h-36 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
              No TradeCredit activity yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallet.ledger.map((entry) => (
                  <TableRow key={entry.ledgerEntryId}>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                      {formatDateTime(entry.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabels[entry.type]}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {numberFormat.format(entry.creditAmount)}
                    </TableCell>
                    <TableCell>
                      {sourceLabels[entry.sourceModule] ?? entry.sourceModule}
                    </TableCell>
                    <TableCell>{reasonLabel(entry)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                      {entry.expiresAt ? formatDateTime(entry.expiresAt) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  value,
  note
}: {
  title: string
  value: string
  note: string
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-semibold text-2xl tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-xs">{note}</CardContent>
    </Card>
  )
}
