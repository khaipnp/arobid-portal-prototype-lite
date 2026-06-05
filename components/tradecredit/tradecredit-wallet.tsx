import { CalendarClockIcon, InfoIcon, Wallet2Icon } from "lucide-react"
import {
  Card,
  CardAction,
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
import type {
  CreditLedgerEntry,
  TradeCreditWallet
} from "@/lib/tradecredit/types"
import { Badge } from "../ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "../ui/empty"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

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
      ? Math.min(
          100,
          Math.round((wallet.monthlyEarned / wallet.monthlyCap) * 100)
        )
      : 0

  return (
    <div className="mt-6 space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Available Credits"
          value={numberFormat.format(wallet.account.availableBalance)}
          note="Credits available to burn"
          icon={<Wallet2Icon />}
        />
        <MetricCard
          title="Reserved Credits"
          value={numberFormat.format(wallet.account.reservedBalance)}
          note="Held for pending checkout"
          icon={<Wallet2Icon />}
        />
        <MetricCard
          title="Expiring Soon"
          value={numberFormat.format(wallet.expiringSoon)}
          note="Earn lots within 30 days"
          icon={<CalendarClockIcon />}
        />
        <MetricCard
          title="Burned Lifetime"
          value={numberFormat.format(wallet.account.burnedLifetime)}
          note="Total credits used"
          icon={<Wallet2Icon />}
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

      <h2 className="mb-4 text-2xl font-bold">Ledger History</h2>

      {wallet.ledger.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No TradeCredit activity yet.</EmptyTitle>
            <EmptyDescription>
              Your ledger is empty. Start earning credits by trading with us.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="border overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallet.ledger.map((entry) => (
                <TableRow key={entry.ledgerEntryId}>
                  <TableCell>
                    <Badge variant="outline">{typeLabels[entry.type]}</Badge>
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {numberFormat.format(entry.creditAmount)}
                  </TableCell>
                  <TableCell>
                    {sourceLabels[entry.sourceModule] ?? entry.sourceModule}
                  </TableCell>
                  <TableCell>{reasonLabel(entry)}</TableCell>
                  <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
                  <TableCell>
                    {entry.expiresAt ? formatDateTime(entry.expiresAt) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  title,
  value,
  note,
  icon
}: {
  title: string
  value: string
  note: string
  icon?: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          {title}
          <Tooltip>
            <TooltipTrigger className="ml-1">
              <InfoIcon size="12" className="text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>{note}</TooltipContent>
          </Tooltip>
        </CardTitle>
        <CardAction className="text-legend">{icon}</CardAction>
      </CardHeader>
      <CardContent className="font-medium text-2xl text-foreground">
        {value}
      </CardContent>
    </Card>
  )
}
